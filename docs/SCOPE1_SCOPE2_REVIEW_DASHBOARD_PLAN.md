# Scope 1 ↔ Scope 2 — Review, Admin & Dashboard Alignment Plan

## Goal (plain language)

Unify **pre-approval** experiences around the Scope 2 **Review & Submit** grid UI (read-only inputs + calculations, no exports, no manual “save to database”). Move **PDF / Excel / charts** to the **post-approval dashboard** only, matching today’s Scope 2 certificate/dashboard flow. Scope 1 admin review should show the same grid the applicant saw.

## Current state (repo)

| Area | Scope 2 today | Scope 1 today |
|------|----------------|---------------|
| User review | `fn/app/scope/review/page.tsx` — 2-column card grid, **inputs only**, `Confirm & Submit` → `save-scope2`, thank-you screen | Wizard step 4 `ResultsPage` in `fn/components/*-wizard.tsx` — tabs, pie chart, `StickyExportBar` (PDF / Excel / JSON / **Save to database** / Submit), **Start over** |
| Admin review | `fn/app/admin/review/[id]/ReviewClient.tsx` — mirrors Scope 2 input grid + approve/reject | `fn/app/admin/review/[id]/Scope1ReviewClient.tsx` — summary card (gross tCO₂e only) |
| Post-approval user UI | `fn/app/scope/certificate/page.tsx` — metrics, **pie chart**, PDF/Excel/BRSR | `fn/app/scope1/report/page.tsx` — gross total + download buttons only |
| Approve hook | Scope 2: parent assessment `APPROVED` + approval email with dashboard OTP | Scope 1: `onScope1Approved` → `generateScope1Reports` + email (`sustally/src/lib/assessment-workflow.ts`) |

**Gap:** Scope 2 review does not yet show a **calculations** quadrant; Scope 1 review is not grid-based and still exposes export/save actions pre-approval.

---

## Target UX

### 1. User — Review & Submit (Scope 1 wizards + optional Scope 2 parity)

```
┌─────────────────────────┬─────────────────────────┐
│  Entered details        │  Entered details        │
│  (org / boundary)       │  (activity / evidence)  │
├─────────────────────────┼─────────────────────────┤
│  Calculations           │  Calculations           │
│  (totals, factors,      │  (drivers / breakdown   │
│   line items in grid)   │   tables in grid)       │
└─────────────────────────┴─────────────────────────┘
        [Back to edit]     [Submit for review]
```

- **Remove** on this step: PDF report, Excel (+ trace), JSON export, **Save to database**, **Start over**.
- **Keep** single primary action: **Submit for review** (same label as `wizard-shared` `StickyExportBar` / power wizard).
- **Submit** must persist payload + locked result server-side in one step (no prior save required).
- **Success** screen: same pattern as Scope 2 review (`Thank you… admin will approve…`).

### 2. Admin — Review queue

- Replace minimal `Scope1ReviewClient` with the **same 2×2 grid** as applicant review (read-only), plus Scope 2 admin chrome (`ReviewClient`: status badge, fixed approve/reject bar).
- **Approve** does not show “save to database”; approval PATCH triggers existing workflow (`scope1-applications` → `onScope1Approved`).

### 3. User — Post-approval dashboard (Scope 1)

- New or extended page modeled on `fn/app/scope/certificate/page.tsx`:
  - Gross Scope 1, intensity metrics, **emissions drivers pie chart** (`EmissionsDriverChart` / Recharts).
  - **PDF** and **Excel** download (reuse `/api/v1/calculations/export` or stored Media from `generateScope1Reports`).
  - No “Save to database” control.
- Entry: unified `/dashboard` OTP flow → branch Scope 1 to dashboard (today redirects to `/scope1/report`).

---

## Implementation phases

### Phase A — Shared review UI kit

**Extract** from `fn/app/scope/review/page.tsx` (and align with `ReviewClient.tsx`):

- `ReviewCard`, `DetailRow`, `DetailGrid`, `MonthlyTable` (optional monthly rows).
- New: `fn/components/review/scope-review-layout.tsx` — header, 2×2 grid shell, footer actions.

**Deliverable:** One layout component used by Scope 2 user review, Scope 2 admin, Scope 1 user review, Scope 1 admin.

### Phase B — Scope 1 user review step (all sectors)

**Files:** `fn/components/scope1-wizard.tsx`, `oilgas-wizard.tsx`, `pulppaper-wizard.tsx`, `power-wizard.tsx`, `ironsteel-wizard.tsx`, `fn/components/wizard-shared.tsx`.

1. Replace `ResultsPage` review UX (or split: review grid vs post-approval dashboard).
2. Add sector-specific **input mappers** (`buildScope1ReviewSections(payload)`) → four cards.
3. Add **calculation mappers** from `CalculationResult` (`buildScope1CalculationGrid(result)`):
   - Gross Scope 1, component rows (cement breakdown cards logic → grid rows).
   - Optional reconciliation / validation summary rows.
4. `StickyExportBar` on review step:
   - `onPdf` / `onExcel` / `onJson` / `onSave` → **omit**.
   - Only `onLock` → label **Submit for review**.
5. Remove **Start over** from review footer; optional **Back to inputs** only.
6. **Submit for review** flow:
   - `runCalculate(true)` if no `calculationId` (auto-save once).
   - `lockScope1Calculation(calculationId, actor)`.
   - Remove `alert('Save to database first…')` guards in all wizards.
7. Thank-you state component (reuse Scope 2 review success block).

### Phase C — Scope 2 review — calculations quadrant

**File:** `fn/app/scope/review/page.tsx`

Add bottom-right (or dedicated) **Emissions & methodology** card populated from `scope2ReviewData` / session:

- Grid emission factor, location-based & market-based emissions (tCO₂e).
- Energy totals (GJ / kWh) where already computed in `fn/app/scope/page.tsx` (`performCalculations`).
- Ensures Scope 2 applicant sees **inputs | calculations** in 2×2 layout (parity with Scope 1 target).

### Phase D — Admin Scope 1 review

**Files:** `fn/app/admin/review/[id]/Scope1ReviewClient.tsx`, `fn/app/admin/review/[id]/page.tsx`, optionally `admin_dashboard/src/components/Scope1AssessmentReview.tsx`.

1. Load `inputPayload` + `result` (+ `grossScope1Tonnes`) from `scope1-applications` / legacy `scope1-assessments`.
2. Render shared `scope-review-layout` + sector mappers (read-only).
3. Footer: **Reject** / **Verify & Approve** (copy `ReviewClient` patterns).
4. Deprecate single-metric-only admin card.

### Phase E — Scope 1 post-approval dashboard

**Files:** new `fn/app/scope1/dashboard/page.tsx` (or expand `certificate`), `fn/app/dashboard/page.tsx`, `fn/lib/dashboard-api.ts`, `sustally/src/lib/dashboard/scope1-generator.ts`.

1. **UI:** Port patterns from `scope/certificate/page.tsx`:
   - Hero metric, driver pie chart, summary cards, download bar.
2. **Session:** After OTP verify, store `scope1_user` with `inputPayload`, `result`, `grossScope1Tonnes`, `reportUrl` (if any).
3. **Routing:** `dashboard/page.tsx` — Scope 1 approved → `/scope1/dashboard?view=…` instead of minimal `/scope1/report`.
4. **Downloads:** PDF / Excel only on dashboard; JSON optional (product decision).
5. **Approve path:** Keep `generateScope1Reports` on approve; no user-facing save step.

### Phase F — API & workflow hardening

| Change | Location |
|--------|----------|
| Upsert application on submit-for-review | `sustally` scope1-applications hooks or `fn` API wrapper |
| Ensure `result` snapshot stored before lock | Existing calculate + lock endpoints |
| Admin notification email | Already `sendScope1AdminNotification` — verify fires on submit |
| Approval email link | Point to `/dashboard?email=…&assessmentId=…` (Scope 2 pattern) |
| E2E cases | `docs/QA_MATRIX.md` — submit → admin grid → approve → OTP dashboard → download |

---

## Data contract (review grid)

Store on submit (Scope 1 application document):

```ts
{
  status: 'PENDING',
  inputPayload: InputPayload,      // full wizard state
  result: CalculationResult,       // locked snapshot
  grossScope1Tonnes: number,
  sectorCode: 'CEMENT' | ...,
  assessmentId: string,
  submittedAt: ISO string,
}
```

Admin and applicant grids both read this snapshot (no recalculation required for review; optional “Recalculate” dev-only).

---

## Out of scope / clarify with product

- **“Press space”** — not found in codebase; confirm if this means a keyboard shortcut, “Express” export, or something else.
- **Iron & steel / power** sector-specific review rows — mappers per sector in Phase B.
- **Moving Scope 2 certificate** — unchanged; only align Scope 1 post-approval to that experience.

---

## Suggested delivery order

1. Phase A (shared layout) — unblocks B, C, D.  
2. Phase B (Scope 1 user review) — highest user impact.  
3. Phase D (admin grid).  
4. Phase E (dashboard).  
5. Phase C (Scope 2 calculation card) — quick win for parity.  
6. Phase F (tests + email links).

---

## Acceptance checklist

- [ ] Applicant review: 2×2 grid, entered values + calculations, no PDF/Excel/save, **Submit for review** works without prior save.
- [ ] No **Start over** on review step.
- [ ] Admin opens submission: same grid as applicant.
- [ ] Approve → applicant receives email → OTP → dashboard with pie chart + PDF/Excel.
- [ ] Scope 2 review shows calculation quadrant (if Phase C included).
- [ ] `npm run test:e2e` / QA matrix rows updated.

---

## Quick test URLs (local)

```bash
cd sustally && npm run dev   # :3001
cd fn && npm run dev         # :3000
```

- Scope 2 review: complete wizard → `/scope/review`
- Scope 1: `/scope1` → finish wizard → review step
- Admin Scope 1: `/admin/review/<applicationId>?type=scope1`
- Admin Scope 2: `/admin/review/<applicationId>`
- Dashboard: `/dashboard?email=…&assessmentId=…`
