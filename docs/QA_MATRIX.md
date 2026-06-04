# QA matrix � unified assessments

Run with `sustally` on **3001** and `fn` on **3000**. See `docs/ENVIRONMENT.md`.

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Book **Scope 2** ? email ? `/assessment/start` ? complete `/scope` ? submit | `assessments` = SUBMITTED, `scope2-applications` = PENDING |
| 2 | Payload: approve Scope 2 | Parent APPROVED, email with `assessmentId`, dashboard OTP ? certificate |
| 3 | Book **Scope 1** ? `/scope1` wizard | Org fields prefilled from booking |
| 4 | Scope 1: Save ? **Submit for review** | `scope1-assessments` pending, parent SUBMITTED |
| 5 | Approve Scope 1 in Payload or `/admin/review/{id}?type=scope1` | PDF in Media, approval email, dashboard OTP ? `/scope1/report` |
| 6 | Reject Scope 1 with reason | Parent REJECTED, retry email with `/scope1?...&retry=true` |
| 7 | Open Scope 2 link for Scope 1 booking | Redirect to `/scope1` |
| 8 | Open approved assessment before OTP | Dashboard sends OTP; verify branches by type |
| 9 | Cement calculate API smoke | `curl -X POST .../cement/calculate -d @samples/bharat-cement-FY2026.json` |
| 10 | Engine regression | `cd sustally && npm run test:engine` (212 tests) |

## Automated checks

```bash
cd sustally && npm run test:engine
npm run smoke                    # sustally on :3001
E2E_SKIP_DB=1 npm run test:e2e  # UI + API only
npm run test:e2e                 # full flow (MongoDB required)
```

## Sign-off

- [ ] All rows passed on local
- [ ] Automated suite green
- [ ] Staging URLs in env
- [ ] SMTP sends (or Ethereal preview in dev)
