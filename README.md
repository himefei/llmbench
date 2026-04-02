# LLM Bench Atlas

A modern leaderboard for large-model evaluation scores, built for Cloudflare Pages.

## What is included

- Public leaderboard homepage with benchmark cards and a cross-benchmark matrix.
- Private admin console at `/console` for adding, editing, and deleting model entries.
- Password login backed by `ADMIN_PASSWORD` and a signed `HttpOnly` session cookie.
- IP-based brute-force protection using Cloudflare KV.
- Optional manual IP blacklist via env var or KV keys.
- D1-backed persistence for model metadata and benchmark scores.

Built-in benchmarks:

- `mmlu`
- `hellaswag`
- `truthfulqa`
- `arc_challenge`
- `gsm8k`
- `humaneval`
- `mbpp`
- `livecodebench`

## Stack

- `Vite + React + TypeScript`
- `Cloudflare Pages Functions`
- `Cloudflare D1`
- `Cloudflare KV`

## Environment variables

Set these in Cloudflare Pages:

- `ADMIN_PASSWORD`: password used to unlock `/console`
- `SESSION_SECRET`: long random string used to sign the admin cookie
- `SESSION_TTL_HOURS`: optional, defaults to `24`
- `ADMIN_IP_BLOCKLIST`: optional comma-separated IP list

Bindings:

- `DB`: D1 database binding
- `SECURITY_KV`: KV namespace binding for rate limiting and blacklist entries

## Manual blacklist support

Two mechanisms are available:

1. `ADMIN_IP_BLOCKLIST` for a static comma-separated denylist.
2. KV keys in `SECURITY_KV` using the format `block:<ip>`.

Example:

```bash
wrangler kv key put --binding=SECURITY_KV "block:203.0.113.10" "1"
```

Failed logins are also tracked automatically under `login-attempt:<ip>` and temporarily blacklisted after repeated failures.

## Local development

Install dependencies:

```bash
npm install
```

Apply the local D1 migration:

```bash
npm run db:migrate:local
```

Build and run with Pages Functions locally:

```bash
npm run cf:dev
```

If you want to bind local secrets directly for development, Cloudflare supports passing bindings to Pages dev, for example:

```bash
wrangler pages dev dist --binding=ADMIN_PASSWORD=your-password --binding=SESSION_SECRET=replace-me --d1 DB=YOUR_D1_DATABASE_ID --kv SECURITY_KV
```

## Cloudflare setup

1. Create a D1 database named `llmbench`.
2. Create a KV namespace for security state.
3. Replace the placeholder IDs inside `wrangler.jsonc`.
4. Add the environment variables listed above in the Pages dashboard.
5. Apply the database migration remotely:

```bash
npm run db:migrate:remote
```

6. Deploy:

```bash
npm run cf:deploy
```

## Data model

Each model entry stores:

- name
- provider
- brand color
- optional logo URL
- optional homepage URL
- notes
- scores for the eight built-in benchmarks

## Security notes

- The admin session is stored in a signed `HttpOnly` cookie, not in `localStorage` or `sessionStorage`.
- Login attempts are checked server-side.
- State-changing admin requests require a valid signed session.
- Same-origin checks are enforced for admin mutations.

## Reference direction

The private admin flow was modeled after the password-gated approach in `himefei/ai-rise`, but adapted to use a stronger cookie-based session instead of exposing an admin token to frontend storage.