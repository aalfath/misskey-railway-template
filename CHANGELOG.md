# Changelog

Breaking changes are listed first in each entry. Read this before you apply a Railway update.

## 2026.11.0 (2026-11-17)

- First release of this template: Misskey 2026.11.0 (`misskey/misskey:2026.11.0@sha256:308f8f1980ae2e7d43209923190dcbbdbece428a0fb1c22060d3576d7bcd2d69`, Node.js 26), Railway Postgres and Railway Redis.
- Config is written from `MISSKEY_URL`, `DATABASE_URL`, `REDIS_URL` and `SETUP_PASSWORD` on every start; migrations run automatically.
- Uploads persist on a volume at `/misskey/files`; Misskey runs as the image's non-root `misskey` user.
