[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/new/template/misskey-1?utm_medium=integration&utm_source=button&utm_campaign=misskey)

# Deploy and Host Misskey on Railway

Misskey is a free, open-source microblogging server (AGPL-3.0) that federates with Mastodon, Pleroma and the rest of the fediverse over ActivityPub. It adds custom emoji reactions, MFM rich text, a Drive for uploads, antennas, channels, pages and an admin control panel. You run one instance on your own domain.

## About Hosting Misskey

This template deploys three services: Misskey 2026.11.0, built from our GitHub repo on the official `misskey/misskey` image pinned by version and digest; Railway Postgres for accounts, notes and follows; and Railway Redis for the job queue, timelines and streaming. Uploads go to a volume at `/misskey/files`, and both databases keep their data on volumes, so a redeploy or restart loses nothing. On every start the wrapper writes Misskey's config from Railway variables, waits for both databases, runs migrations and starts the server as a non-root user. Railway checks `/healthz`, which only answers 200 when Postgres and Redis are both reachable.

## Common Use Cases

* A personal or small-community fediverse server on your own domain
* A Misskey instance for a club, project or fandom with its own moderation rules and custom emoji
* A staging or test instance before you move an existing Misskey server

## Dependencies for Misskey Hosting

* PostgreSQL (Railway Postgres, included)
* Redis (Railway Redis, included)

### Deployment Dependencies

* Misskey release notes: https://github.com/misskey-dev/misskey/releases/tag/2026.11.0
* Official Docker image: https://hub.docker.com/r/misskey/misskey
* Misskey docs (Docker install): https://misskey-hub.net/en/docs/for-admin/install/guides/docker/
* Template repo: https://github.com/aalfath/misskey-railway-template

### Implementation Details

**First login.** Misskey has no default account. Open the Misskey service's **Variables** tab and copy `SETUP_PASSWORD` (generated at deploy). Open your public URL, choose a username and password for the admin account and enter the setup password when asked. Only the first account can be created this way; registrations are closed until you open them in the Control Panel.

**Choose the domain before you federate.** Misskey's URL can't change once the instance has users and has talked to other servers. `MISSKEY_URL` defaults to `https://${{RAILWAY_PUBLIC_DOMAIN}}`. To use your own domain, add it to the Misskey service in Railway's **Settings → Networking**, set `MISSKEY_URL=https://YOUR-DOMAIN` and redeploy **before** you create the admin account.

**Optional settings** (not template variables): e-mail (SMTP), object storage (S3) and captchas are set in the Control Panel after login. `MISSKEY_CLUSTER_LIMIT` (default `1`) sets the number of worker processes; raise it only if you give the service more memory. Search uses Postgres (`sqlLike`), so no Meilisearch service is needed.

**Updates.** The services build from `aalfath/misskey-railway-template`. When we bump the pinned Misskey version, Railway shows an update notice in your project; read the repo's `CHANGELOG.md`, then apply it. Migrations run automatically on start.

## Why Deploy Misskey on Railway?

<!-- Recommended: Keep this section as shown below -->
Railway is a singular platform to deploy your infrastructure stack. Railway will host your infrastructure so you don't have to deal with configuration, while allowing you to vertically and horizontally scale it.

By deploying Misskey on Railway, you are one step closer to supporting a complete full-stack application with minimal burden. Host your servers, databases, AI agents, and more on Railway.
<!-- End recommended section -->

## Template contents

| File | What it does |
|---|---|
| `Dockerfile` | `FROM misskey/misskey:2026.11.0@sha256:308f8f1980ae2e7d43209923190dcbbdbece428a0fb1c22060d3576d7bcd2d69`, plus the wrapper below |
| `railway-entrypoint.sh` | Chowns the `/misskey/files` volume to uid 991, writes the config, then starts Misskey as the `misskey` user (`node scripts/start.mjs --migrate`) |
| `write-config.mjs` | Builds `/misskey/.config/default.yml` from the variables and waits for Postgres and Redis |

## Variables (Misskey service)

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `3000` | Port Misskey listens on; the public domain targets it |
| `MISSKEY_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` | Public URL of the instance. Fix it before the first login |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Private Postgres connection |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` | Private Redis connection |
| `SETUP_PASSWORD` | `${{secret(32)}}` | Needed once to create the first admin account |
| `MISSKEY_CLUSTER_LIMIT` | not set (`1`) | Optional: number of worker processes |

## Local test

`docker compose -f compose.test.yml up --build` runs the same wrapper with local Postgres 18 and Redis on `http://localhost:42490` (setup password `setup-test-123`, test only).

## Licence

The wrapper in this repo is MIT-licensed. Misskey itself is AGPL-3.0 (https://github.com/misskey-dev/misskey).
