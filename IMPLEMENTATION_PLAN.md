# Unified Scope 1 + Scope 2 � Implementation Tracker

## Phase 0 � Prep � Done

- [x] `docs/ENVIRONMENT.md` � local env and smoke checklist
- [x] `docs/FIELD_MAPPING.md` � booking ? form field + sector map
- [x] `docs/PRODUCT_RULE.md` � Option A (full gate before official report)
- [x] `fn/lib/assessment-mapper.ts` � sector hints + organization prefill

## Phases 1�4 � Done

Unified data model, booking UI, assessment router, Scope 2 wire-up.

## Phase 5 � Scope 1 backend in sustally � Done

Engine, APIs, persist, 212 engine tests.

## Phase 6 � Scope 1 frontend in fn � Done

Wizards, `/scope1`, `scope1-api` client, `tsc` clean.

## Phase 7 � Unified admin & review � Done

- [x] Payload admin copy on `assessments`, `scope1-assessments`, `scope1-applications`, `scope2-applications`
- [x] Scope 1 approve ? `assessment-workflow` + report generation hook
- [x] Scope 1 reject ? parent `REJECTED` + retry email (`buildAssessmentRetryLink`)
- [x] `rejectionReason` on `scope1-assessments`
- [x] `fn/app/admin/review/[id]?type=scope1` � Scope 1 review UI

## Phase 8 � Dashboard, email, OTP � Done (core)

- [x] `generateScope1Reports` on approve (PDF + XLSX ? Media, `reportUrl`)
- [x] Unified `/api/assessments/generate-otp` & `verify-otp`
- [x] `fn` dashboard branches Scope 1 vs 2
- [x] `/scope1/report` download page
- [ ] Optional: scope2 dashboard generator wrapper (certificate data pre-staged)

## Phase 9 — Profile dedup — Done

- [x] `assessment-mapper` + `useScope1OrganizationPrefill` on all five wizards
- [x] `CalculatorRoot` sector hint from booking sector
- [x] Scope 2 prefill via validate + `assessmentSession`
- [x] Submit for review on all Scope 1 wizards

## Phase 10

## Phase 10 — Testing & QA — Done

- [x] E2E matrix in `docs/QA_MATRIX.md`
- [x] Playwright smoke (`e2e/`, root `npm run test:e2e`)
- [x] CORS regression in `e2e/api-smoke.spec.ts` + `scripts/smoke-unified.sh`

## Phase 11 — Deploy & deprecate — Done

- [x] Deploy guide in `docs/DEPLOY.md`
- [x] `scope-1-calculator/DEPRECATED.md` + root README
- [x] `migrate:bookings` / `migrate:bookings:dry` scripts

---

## Quick local test

```bash
cd sustally && npm run dev          # :3001
cd fn && npm run dev                # :3000
```

Scope 1 admin review: `http://localhost:3000/admin/review/<scope1-application-id>?type=scope1` (or legacy `scope1-assessments` id)
