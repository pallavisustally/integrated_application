# Sustally — unified Scope 1 + Scope 2 assessments

Single product: public booking → email link → Scope 1 or Scope 2 form → admin review → OTP dashboard → download.

| App | Folder | Port | Role |
|-----|--------|------|------|
| User UI | `fn` | 3000 | Booking, wizards, certificate, dashboard |
| API / CMS | `sustally` | 3001 | MongoDB, Payload admin, calculation engines |

## Quick start

```bash
# Terminal 1
cd sustally && pnpm install && pnpm dev

# Terminal 2
cd fn && npm install && NEXT_PUBLIC_SUSTALLY_API_URL=http://localhost:3001 npm run dev
```

Open http://localhost:3000

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | Env vars and local smoke |
| [docs/FIELD_MAPPING.md](docs/FIELD_MAPPING.md) | Booking → form field map |
| [docs/PRODUCT_RULE.md](docs/PRODUCT_RULE.md) | Scope 1 approval gate (Option A) |
| [docs/QA_MATRIX.md](docs/QA_MATRIX.md) | Manual QA checklist |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Production deploy order |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | Phase tracker (0–11) |

## Tests

```bash
# Engine unit tests (212)
cd sustally && npm run test:engine

# Curl smoke (sustally on :3001)
npm run smoke

# Playwright E2E (starts fn + sustally; needs MongoDB for booking tests)
npm install
npx playwright install chromium
npm run test:e2e

# Skip DB-dependent E2E
E2E_SKIP_DB=1 npm run test:e2e

# Dev servers already running
PW_NO_WEBSERVER=1 npm run test:e2e
```

## Legacy Scope 1 repo

The standalone `scope-1-calculator` app is **deprecated**. See [../scope-1-calculator/DEPRECATED.md](../scope-1-calculator/DEPRECATED.md).

## Migration

Legacy `slot-bookings` → `assessments`:

```bash
cd sustally
npm run migrate:bookings:dry
npm run migrate:bookings
```
