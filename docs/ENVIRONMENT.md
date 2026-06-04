# Unified assessments � environment setup

## Local ports

| App | Directory | Port | Command |
|-----|-----------|------|---------|
| User UI | `fn` | 3000 | `npm run dev` |
| API / CMS | `sustally` | 3001 | `npm run dev` |

## `fn` (.env.local)

```bash
NEXT_PUBLIC_SUSTALLY_API_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## `sustally` (.env)

```bash
DATABASE_URL=mongodb://127.0.0.1/sustally
PAYLOAD_SECRET=<random-secret>

# User-facing app (emails, assessment links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3001

# CORS (fn dev origin)
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Email (optional in dev � Ethereal fallback when unset)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM_ADDRESS=
SMTP_FROM_NAME=Sustally

ADMIN_EMAIL=admin@sustally.com
# Standalone admin UI (admin_dashboard/, port 3002)
ADMIN_DASHBOARD_URL=http://localhost:3002
# Optional: use fn /admin/review instead of port 3002
# ADMIN_REVIEW_USE_FN=true
```

## Smoke checklist

1. `cd sustally && npm run dev`
2. `cd fn && NEXT_PUBLIC_SUSTALLY_API_URL=http://localhost:3001 npm run dev`
3. `cd admin_dashboard && npm run dev` (port **3002** — admin review links)
4. Open http://localhost:3000 ? book Scope 1 or 2 ? open `/assessment/start` link
5. Payload admin: http://localhost:3001/admin

## Production

Set `NEXT_PUBLIC_APP_URL` to the public `fn` URL and `PAYLOAD_PUBLIC_SERVER_URL` / `NEXT_PUBLIC_SUSTALLY_API_URL` to the public `sustally` URL.
