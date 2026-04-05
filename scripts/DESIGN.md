# DESIGN.md

## Prerender Flow

```mermaid
sequenceDiagram
  participant Build as npm run build
  participant Script as scripts/prerender.mjs
  participant Server as Temporary dist server
  participant Browser as Puppeteer
  participant Dist as dist/

  Build->>Script: invoke after frontend build
  Script->>Server: serve built dist/ files locally
  loop each stable public route
    Script->>Browser: open route
    Browser->>Server: GET route assets and HTML
    Browser-->>Script: rendered HTML snapshot
    Script->>Dist: write route/index.html
  end
```

## Backup Flow

```mermaid
flowchart TD
  Runner[Operator or cron] --> Backup[scripts/backup-production.sh]
  Backup --> Dump[mysqldump full DB snapshot]
  Backup --> Tar[tar full api/assets archive]
  Backup --> Helper[scripts/build-backup-artifacts.php]
  Helper --> DB[(MySQL metadata)]
  Helper --> Assets[api/assets]
  Helper --> Artifacts[asset manifests, upload plan, financial DB export]
  Backup --> Local[local backup directory]
  Artifacts --> Local
  Backup -->|optional| GCS[gcloud storage upload]
  GCS --> General[general retention path]
  GCS --> Financial[financial retention path]
```

## Stable Design Decisions

- **Decision:** `prerender.mjs` runs after the SPA build and writes route-specific HTML snapshots into `dist/` rather than replacing React routing with a separate static-site generator.
- **Decision:** Prerendering uses a temporary local server plus Puppeteer so the exported HTML reflects the built client bundle and runtime metadata behavior that users actually receive.
- **Decision:** `backup-production.sh` remains the shell orchestrator for local snapshots, optional uploads, and scheduling decisions, while `build-backup-artifacts.php` handles database-aware classification because that logic depends on application data structures.
- **Decision:** The backup strategy intentionally combines a simple local full backup (`db.sql.gz` plus `api-assets.tar.gz`) with remote incremental uploads so restores stay straightforward without paying repeated long-term storage costs for unchanged files.
- **Decision:** Asset classification between `financial` and `general` is derived from durable database metadata, especially archived payment requests and invoices, rather than a hand-maintained file allowlist.
- **Decision:** Remote upload is optional and schedule-based; the scripts must still produce complete local backup output even when no GCS environment is configured.
