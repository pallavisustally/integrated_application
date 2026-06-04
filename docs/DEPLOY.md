# Deploy � unified Scope 1 + Scope 2

## Pre-deploy checklist

- [ ] `npm run test:engine` in `sustally` (212 tests)
- [ ] `npm run smoke` with sustally running (see `docs/ENVIRONMENT.md`)
- [ ] `npm run test:e2e` from repo root (MongoDB required for booking tests)
- [ ] Env vars set per environment (below)
- [ ] Legacy `slot-bookings` migrated if production has old rows: `npm run migrate:bookings:dry` then `npm run migrate:bookings`

## Deploy order

Deploy **sustally** (API + Payload admin) first, then **fn** (public UI). This keeps new API routes available before the frontend points at them.

### 1. sustally (port 3001 / `api.yourdomain.com`)

Required:

```bash
DATABASE_URL=mongodb+srv://...
PAYLOAD_SECRET=<strong-random>
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
PAYLOAD_PUBLIC_SERVER_URL=https://api.yourdomain.com
CORS_ORIGINS=https://app.yourdomain.com
```

Email (approval / OTP):

```bash
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM_ADDRESS=...
ADMIN_EMAIL=...
```

Build and start:

```bash
cd sustally
pnpm install
pnpm run build
pnpm run start
```

### 2. fn (port 3000 / `app.yourdomain.com`)

```bash
NEXT_PUBLIC_SUSTALLY_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
```

```bash
cd fn
npm install
npm run build
npm run start
```

## Post-deploy smoke

```bash
curl -sf "https://api.yourdomain.com/api/v1/factors?sector=cement"
curl -sf -X POST "https://api.yourdomain.com/api/v1/calculations/cement/calculate" \
  -H "Content-Type: application/json" \
  -d @sustally/samples/bharat-cement-FY2026.json
```

Open `https://app.yourdomain.com` ? book a test slot ? confirm email link hits `/assessment/start`.

## Deprecating standalone Scope 1

The legacy app lives in `../scope-1-calculator`. Do not deploy new instances. See `scope-1-calculator/DEPRECATED.md`.

## Rollback

- Revert fn deployment first (users stop hitting new routes).
- Revert sustally if schema/API changes are incompatible.
- MongoDB assessments data is forward-compatible; keep backups before migration scripts.
