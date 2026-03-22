#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
API_DIR="$REPO_ROOT/api"
HELPER_SCRIPT="$SCRIPT_DIR/build-backup-artifacts.php"
CONFIG_FILE="${CONFIG_FILE:-$API_DIR/config.php}"
SITE_NAME="${SITE_NAME:-mut-taucher}"
BACKUP_ROOT="${BACKUP_ROOT:-}"
TIMESTAMP="$(date +%F-%H%M%S)"

GCS_GENERAL_BUCKET_URL="${GCS_GENERAL_BUCKET_URL:-}"
GCS_FINANCIAL_BUCKET_URL="${GCS_FINANCIAL_BUCKET_URL:-}"
GCS_GENERAL_DB_UPLOAD_SCHEDULE="${GCS_GENERAL_DB_UPLOAD_SCHEDULE:-monthly}"
GCS_FINANCIAL_DB_UPLOAD_SCHEDULE="${GCS_FINANCIAL_DB_UPLOAD_SCHEDULE:-daily}"

usage() {
  cat <<EOF
Usage: $(basename "$0") [--backup-root PATH] [--site-name NAME] [--gcs-general-bucket gs://BUCKET[/PREFIX]] [--gcs-financial-bucket gs://BUCKET[/PREFIX]] [--help]

Creates a production backup of:
- a local full MySQL snapshot
- a local full api/assets/ tarball
- GCS-ready incremental asset manifests split into financial vs general retention classes
- a financial database archive export

Environment overrides:
- CONFIG_FILE
- BACKUP_ROOT
- SITE_NAME
- GCS_GENERAL_BUCKET_URL
- GCS_FINANCIAL_BUCKET_URL
- GCS_GENERAL_STORAGE_CLASS
- GCS_FINANCIAL_STORAGE_CLASS
- GCS_GENERAL_DB_UPLOAD_SCHEDULE (never|daily|weekly|monthly, default: monthly)
- GCS_FINANCIAL_DB_UPLOAD_SCHEDULE (never|daily|weekly|monthly, default: daily)
- GCS_KEY_FILE
- GCS_SERVICE_ACCOUNT
- GCS_PROJECT

Examples:
  $(basename "$0")
  BACKUP_ROOT=/home/user/backups/mut-taucher $(basename "$0")
  GCS_GENERAL_BUCKET_URL=gs://mt-general-backups/mut-taucher \\
  GCS_FINANCIAL_BUCKET_URL=gs://mt-financial-backups/mut-taucher \\
  $(basename "$0")
EOF
}

require_file() {
  local path="$1"
  local label="$2"

  if [[ ! -f "$path" ]]; then
    echo "$label not found: $path" >&2
    exit 1
  fi
}

require_dir() {
  local path="$1"
  local label="$2"

  if [[ ! -d "$path" ]]; then
    echo "$label not found: $path" >&2
    exit 1
  fi
}

require_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Required command not found in PATH: $cmd" >&2
    exit 1
  fi
}

json_escape() {
  php -r 'echo json_encode($argv[1], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);' -- "$1"
}

sha256_file() {
  local path="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$path" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$path" | awk '{print $1}'
  else
    echo "Neither sha256sum nor shasum was found in PATH." >&2
    exit 1
  fi
}

join_gcs_path() {
  local base="${1%/}"
  local suffix="${2#/}"
  printf '%s/%s' "$base" "$suffix"
}

should_run_schedule() {
  local schedule="$1"

  case "$schedule" in
    always|daily)
      return 0
      ;;
    weekly)
      [[ "$(date +%u)" == "7" ]]
      return
      ;;
    monthly)
      [[ "$(date +%d)" == "01" ]]
      return
      ;;
    never)
      return 1
      ;;
    *)
      echo "Unknown upload schedule: $schedule" >&2
      exit 1
      ;;
  esac
}

authenticate_gcloud_if_needed() {
  if [[ -z "$GCS_GENERAL_BUCKET_URL" && -z "$GCS_FINANCIAL_BUCKET_URL" ]]; then
    return
  fi

  require_command gcloud

  if [[ -n "${GCS_KEY_FILE:-}" || -n "${GCS_SERVICE_ACCOUNT:-}" || -n "${GCS_PROJECT:-}" ]]; then
    if [[ -z "${GCS_KEY_FILE:-}" ]]; then
      echo "GCS_KEY_FILE is required when GCS authentication options are provided." >&2
      exit 1
    fi
    require_file "$GCS_KEY_FILE" "GCS key file"

    local auth_cmd=(gcloud auth activate-service-account)
    if [[ -n "${GCS_SERVICE_ACCOUNT:-}" ]]; then
      auth_cmd+=("${GCS_SERVICE_ACCOUNT}")
    fi
    auth_cmd+=(--key-file="$GCS_KEY_FILE" --quiet)
    if [[ -n "${GCS_PROJECT:-}" ]]; then
      auth_cmd+=(--project="$GCS_PROJECT")
    fi

    "${auth_cmd[@]}"
  fi
}

upload_file() {
  local source="$1"
  local destination="$2"
  local storage_class="${3:-}"
  local no_clobber="${4:-false}"

  local cmd=(gcloud storage cp --print-created-message)
  if [[ "$no_clobber" == "true" ]]; then
    cmd+=(--no-clobber)
  fi
  if [[ -n "$storage_class" ]]; then
    cmd+=(--storage-class="$storage_class")
  fi
  cmd+=("$source" "$destination")

  "${cmd[@]}"
}

create_financial_db_manifest() {
  local manifest_path="$1"
  local blob_path="$2"
  local metadata_path="$3"
  local sha256="$4"
  local bytes="$5"
  local generated_at
  generated_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  cat >"$manifest_path" <<EOF
{
  "version": 1,
  "siteName": $(json_escape "$SITE_NAME"),
  "scope": "financial_database_archive",
  "generatedAt": $(json_escape "$generated_at"),
  "blobPath": $(json_escape "$blob_path"),
  "metadataPath": $(json_escape "$metadata_path"),
  "sha256": $(json_escape "$sha256"),
  "bytes": $bytes
}
EOF
}

create_general_db_manifest() {
  local manifest_path="$1"
  local blob_path="$2"
  local sha256="$3"
  local bytes="$4"
  local generated_at
  generated_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  cat >"$manifest_path" <<EOF
{
  "version": 1,
  "siteName": $(json_escape "$SITE_NAME"),
  "scope": "general_full_database_snapshot",
  "generatedAt": $(json_escape "$generated_at"),
  "blobPath": $(json_escape "$blob_path"),
  "sha256": $(json_escape "$sha256"),
  "bytes": $bytes
}
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backup-root)
      BACKUP_ROOT="$2"
      shift 2
      ;;
    --site-name)
      SITE_NAME="$2"
      shift 2
      ;;
    --gcs-general-bucket)
      GCS_GENERAL_BUCKET_URL="$2"
      shift 2
      ;;
    --gcs-financial-bucket)
      GCS_FINANCIAL_BUCKET_URL="$2"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "$BACKUP_ROOT" ]]; then
  BACKUP_ROOT="$HOME/backups/$SITE_NAME"
fi

DEST_DIR="$BACKUP_ROOT/$TIMESTAMP"
ARTIFACT_DIR="$DEST_DIR/backup-artifacts"
DATE_PATH="$(date +%Y/%m)"

require_file "$CONFIG_FILE" "Config file"
require_file "$HELPER_SCRIPT" "Backup helper script"
require_dir "$API_DIR/assets" "Assets directory"
require_command php
require_command tar

if command -v mysqldump >/dev/null 2>&1; then
  MYSQLDUMP_BIN="mysqldump"
elif command -v mariadb-dump >/dev/null 2>&1; then
  MYSQLDUMP_BIN="mariadb-dump"
else
  echo "Neither mysqldump nor mariadb-dump was found in PATH." >&2
  exit 1
fi

eval "$(
  php -r '
    $config = require $argv[1];
    foreach (["db_host", "db_user", "db_pass", "db_name"] as $key) {
        $value = $config[$key] ?? "";
        echo strtoupper($key) . "=" . escapeshellarg($value) . PHP_EOL;
    }
  ' "$CONFIG_FILE"
)"

if [[ -z "${DB_NAME:-}" || -z "${DB_USER:-}" ]]; then
  echo "Database credentials are incomplete in $CONFIG_FILE" >&2
  exit 1
fi

DB_HOST="${DB_HOST:-localhost}"

mkdir -p "$DEST_DIR" "$ARTIFACT_DIR"

TMP_CNF="$(mktemp)"
cleanup() {
  rm -f "$TMP_CNF"
}
trap cleanup EXIT

cat >"$TMP_CNF" <<EOF
[client]
host=$DB_HOST
user=$DB_USER
password=$DB_PASS
default-character-set=utf8mb4
EOF
chmod 600 "$TMP_CNF"

DB_DUMP="$DEST_DIR/db.sql.gz"
ASSETS_DUMP="$DEST_DIR/api-assets.tar.gz"

"$MYSQLDUMP_BIN" \
  --defaults-extra-file="$TMP_CNF" \
  --single-transaction \
  --routines \
  --triggers \
  "$DB_NAME" | gzip -n >"$DB_DUMP"

tar -czf "$ASSETS_DUMP" -C "$API_DIR" assets

php "$HELPER_SCRIPT" \
  --config "$CONFIG_FILE" \
  --api-dir "$API_DIR" \
  --output-dir "$ARTIFACT_DIR" \
  --site-name "$SITE_NAME"

FINANCIAL_DB_JSON="$ARTIFACT_DIR/db-financial.json"
FINANCIAL_DB_GZ="$ARTIFACT_DIR/db-financial.json.gz"
gzip -n -c "$FINANCIAL_DB_JSON" >"$FINANCIAL_DB_GZ"
rm -f "$FINANCIAL_DB_JSON"

FINANCIAL_DB_SHA="$(sha256_file "$FINANCIAL_DB_GZ")"
FINANCIAL_DB_BYTES="$(wc -c <"$FINANCIAL_DB_GZ" | tr -d ' ')"
GENERAL_DB_SHA="$(sha256_file "$DB_DUMP")"
GENERAL_DB_BYTES="$(wc -c <"$DB_DUMP" | tr -d ' ')"

FINANCIAL_DB_BLOB_PATH="db/financial/blobs/${FINANCIAL_DB_SHA}.json.gz"
FINANCIAL_DB_METADATA_OBJECT="db/financial/metadata/${DATE_PATH}/${TIMESTAMP}.json"
FINANCIAL_DB_MANIFEST_OBJECT="db/financial/manifests/${DATE_PATH}/${TIMESTAMP}.json"
GENERAL_DB_OBJECT="db/full/${GCS_GENERAL_DB_UPLOAD_SCHEDULE}/${DATE_PATH}/${TIMESTAMP}/db.sql.gz"
GENERAL_DB_MANIFEST_OBJECT="db/full/manifests/${DATE_PATH}/${TIMESTAMP}.json"

create_financial_db_manifest \
  "$ARTIFACT_DIR/db-financial.manifest.json" \
  "$FINANCIAL_DB_BLOB_PATH" \
  "$FINANCIAL_DB_METADATA_OBJECT" \
  "$FINANCIAL_DB_SHA" \
  "$FINANCIAL_DB_BYTES"

create_general_db_manifest \
  "$ARTIFACT_DIR/db-full.manifest.json" \
  "$GENERAL_DB_OBJECT" \
  "$GENERAL_DB_SHA" \
  "$GENERAL_DB_BYTES"

ln -sfn "$DEST_DIR" "$BACKUP_ROOT/latest"

echo "Backup created:"
echo "  DB:              $DB_DUMP"
echo "  Assets:          $ASSETS_DUMP"
echo "  Financial export: $FINANCIAL_DB_GZ"
echo "  Metadata:        $ARTIFACT_DIR"
echo "  Latest:          $BACKUP_ROOT/latest"

authenticate_gcloud_if_needed

if [[ -n "$GCS_GENERAL_BUCKET_URL" || -n "$GCS_FINANCIAL_BUCKET_URL" ]]; then
  UPLOAD_PLAN="$ARTIFACT_DIR/assets-upload-plan.tsv"
  while IFS=$'\t' read -r bucket_class source_path blob_path _sha256 _size; do
    [[ -z "$bucket_class" ]] && continue

    case "$bucket_class" in
      financial)
        [[ -z "$GCS_FINANCIAL_BUCKET_URL" ]] && continue
        upload_file \
          "$source_path" \
          "$(join_gcs_path "$GCS_FINANCIAL_BUCKET_URL" "$blob_path")" \
          "${GCS_FINANCIAL_STORAGE_CLASS:-}" \
          true
        ;;
      general)
        [[ -z "$GCS_GENERAL_BUCKET_URL" ]] && continue
        upload_file \
          "$source_path" \
          "$(join_gcs_path "$GCS_GENERAL_BUCKET_URL" "$blob_path")" \
          "${GCS_GENERAL_STORAGE_CLASS:-}" \
          true
        ;;
      *)
        echo "Unknown asset bucket class in upload plan: $bucket_class" >&2
        exit 1
        ;;
    esac
  done <"$UPLOAD_PLAN"

  if [[ -n "$GCS_GENERAL_BUCKET_URL" ]]; then
    upload_file \
      "$ARTIFACT_DIR/assets-general-manifest.json" \
      "$(join_gcs_path "$GCS_GENERAL_BUCKET_URL" "assets/manifests/general/${DATE_PATH}/${TIMESTAMP}.json")" \
      "${GCS_GENERAL_STORAGE_CLASS:-}"

    if should_run_schedule "$GCS_GENERAL_DB_UPLOAD_SCHEDULE"; then
      upload_file \
        "$DB_DUMP" \
        "$(join_gcs_path "$GCS_GENERAL_BUCKET_URL" "$GENERAL_DB_OBJECT")" \
        "${GCS_GENERAL_STORAGE_CLASS:-}"
      upload_file \
        "$ARTIFACT_DIR/db-full.manifest.json" \
        "$(join_gcs_path "$GCS_GENERAL_BUCKET_URL" "$GENERAL_DB_MANIFEST_OBJECT")" \
        "${GCS_GENERAL_STORAGE_CLASS:-}"
      echo "  GCS general DB:  $(join_gcs_path "$GCS_GENERAL_BUCKET_URL" "$GENERAL_DB_OBJECT")"
    else
      echo "  GCS general DB:  skipped (schedule: $GCS_GENERAL_DB_UPLOAD_SCHEDULE)"
    fi

    echo "  GCS general assets manifest: $(join_gcs_path "$GCS_GENERAL_BUCKET_URL" "assets/manifests/general/${DATE_PATH}/${TIMESTAMP}.json")"
  fi

  if [[ -n "$GCS_FINANCIAL_BUCKET_URL" ]]; then
    upload_file \
      "$ARTIFACT_DIR/assets-financial-manifest.json" \
      "$(join_gcs_path "$GCS_FINANCIAL_BUCKET_URL" "assets/manifests/financial/${DATE_PATH}/${TIMESTAMP}.json")" \
      "${GCS_FINANCIAL_STORAGE_CLASS:-}"

    if should_run_schedule "$GCS_FINANCIAL_DB_UPLOAD_SCHEDULE"; then
      upload_file \
        "$FINANCIAL_DB_GZ" \
        "$(join_gcs_path "$GCS_FINANCIAL_BUCKET_URL" "$FINANCIAL_DB_BLOB_PATH")" \
        "${GCS_FINANCIAL_STORAGE_CLASS:-}" \
        true
      upload_file \
        "$ARTIFACT_DIR/db-financial.metadata.json" \
        "$(join_gcs_path "$GCS_FINANCIAL_BUCKET_URL" "$FINANCIAL_DB_METADATA_OBJECT")" \
        "${GCS_FINANCIAL_STORAGE_CLASS:-}"
      upload_file \
        "$ARTIFACT_DIR/db-financial.manifest.json" \
        "$(join_gcs_path "$GCS_FINANCIAL_BUCKET_URL" "$FINANCIAL_DB_MANIFEST_OBJECT")" \
        "${GCS_FINANCIAL_STORAGE_CLASS:-}"
      echo "  GCS financial DB: $(join_gcs_path "$GCS_FINANCIAL_BUCKET_URL" "$FINANCIAL_DB_MANIFEST_OBJECT")"
    else
      echo "  GCS financial DB: skipped (schedule: $GCS_FINANCIAL_DB_UPLOAD_SCHEDULE)"
    fi

    echo "  GCS financial assets manifest: $(join_gcs_path "$GCS_FINANCIAL_BUCKET_URL" "assets/manifests/financial/${DATE_PATH}/${TIMESTAMP}.json")"
  fi
fi
