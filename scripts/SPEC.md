# SPEC.md

## Purpose and Scope

`scripts/` owns repository-local automation that runs outside the browser and request/response runtime. It covers post-build prerendering for stable public routes and operator-run backup tooling for database and asset retention.

## Main Capabilities

- `prerender.mjs`: prerender selected public SPA routes into static HTML under `dist/` after the frontend build
- `backup-production.sh`: create a local full MySQL dump, a local full `api/assets/` archive, and optional GCS uploads
- `build-backup-artifacts.php`: classify archived files into `financial` and `general` retention classes, build content-addressed asset manifests, and export money-relevant database metadata

## Important Integration Points

- `dist/`, the stable public route list, and Puppeteer/Chrome for prerender output
- `api/config.php`, MySQL, and `api/assets/` for backup generation
- `gcloud`, `mysqldump`, `tar`, and environment-provided bucket configuration for optional remote backup upload
- Root documentation in [SPEC.md](../SPEC.md), [DESIGN.md](../DESIGN.md), and [README.md](../README.md) for operator-facing context

## Important Constraints

- Scripts in this subtree are build-time or operator-run tooling, not part of the public SPA or authenticated admin runtime surface.
- Prerendering should cover only stable public routes; admin pages and authenticated state stay runtime-rendered.
- The backup flow must always remain useful without GCS by producing a local full database snapshot and a local full `api/assets/` archive on every run.
- Financial-vs-general archive classification must come from durable application metadata such as `client_documents`, booking numbers, invoice numbers, and related payment flags rather than from filename conventions alone.
- Remote backup uploads must preserve the separate retention classes for `financial` and `general` artifacts and keep asset blobs content-addressed so unchanged files are not re-uploaded unnecessarily.
- Secrets and service-account keys used by these scripts must stay outside the repository and outside the web root.
