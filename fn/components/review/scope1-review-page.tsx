'use client'

import type { ReactNode } from 'react'

import type { Scope1ReviewQuadrants } from '@/lib/scope1-review-build'

import {
  BoundaryIcon,
  CalcIcon,
  CheckIcon,
  EnergyIcon,
  ReviewCard,
  ReviewCardFields,
} from './review-primitives'

function ReviewQuadrantGrid({ quadrants }: { quadrants: Scope1ReviewQuadrants }) {
  return (
    <div className="review-grid">
      <ReviewCard title={quadrants.orgBoundary.title} icon={<BoundaryIcon />} accentColor={quadrants.orgBoundary.accentColor}>
        <ReviewCardFields fields={quadrants.orgBoundary.fields} />
      </ReviewCard>
      <ReviewCard title={quadrants.activity.title} icon={<EnergyIcon />} accentColor={quadrants.activity.accentColor}>
        <ReviewCardFields fields={quadrants.activity.fields} />
      </ReviewCard>
      <ReviewCard title={quadrants.calcSummary.title} icon={<CalcIcon />} accentColor={quadrants.calcSummary.accentColor}>
        <ReviewCardFields fields={quadrants.calcSummary.fields} />
      </ReviewCard>
      <ReviewCard title={quadrants.calcBreakdown.title} icon={<CalcIcon />} accentColor={quadrants.calcBreakdown.accentColor}>
        <ReviewCardFields fields={quadrants.calcBreakdown.fields} />
      </ReviewCard>
    </div>
  )
}

/** Success state — rendered inside wizard-main. */
export function Scope1ReviewSubmittedContent({ sectorLabel = 'Scope 1' }: { sectorLabel?: string }) {
  return (
    <section className="step-page active review-step-page review-submitted-page">
      <div className="form-card review-submitted-card">
        <div className="review-submitted-icon" aria-hidden>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 className="step-title" style={{ fontSize: '36px', marginBottom: 12 }}>
          Thank you!
        </h1>
        <p className="step-sub" style={{ margin: '0 auto', maxWidth: '520px' }}>
          Your {sectorLabel} inventory has been submitted. You will receive your official report by email once an
          administrator approves your submission.
        </p>
      </div>
    </section>
  )
}

/** Review step body — rendered inside wizard-main with shared chrome. */
export function Scope1ReviewContent({
  quadrants,
  busy,
  onBack,
  onSubmit,
  submitError,
}: {
  quadrants: Scope1ReviewQuadrants
  busy: boolean
  onBack: () => void
  onSubmit: () => void
  submitError?: string | null
}) {
  return (
    <section className="step-page active review-step-page">
      <h1 className="step-title">
        Review &amp; <em>submit</em>
      </h1>
      <p className="step-sub">
        Review entered details and calculated emissions before submitting for admin approval.
      </p>

      <ReviewQuadrantGrid quadrants={quadrants} />

      {submitError ? <p className="field-error" style={{ marginBottom: 16 }}>{submitError}</p> : null}

      <div className="step-footer">
        <button type="button" className="btn ghost" onClick={onBack}>
          Back to edit
        </button>
        <button type="button" className="btn primary" onClick={onSubmit} disabled={busy}>
          {busy ? 'Submitting…' : 'Submit for review'}
          {!busy ? <CheckIcon /> : null}
        </button>
      </div>
    </section>
  )
}

/** @deprecated Use Scope1ReviewContent inside wizard shell. Kept for compatibility. */
export function Scope1ReviewSubmittedScreen({ sectorLabel = 'Scope 1' }: { sectorLabel?: string }) {
  return (
    <main className="wizard-app">
      <section className="wizard-main">
        <Scope1ReviewSubmittedContent sectorLabel={sectorLabel} />
      </section>
    </main>
  )
}

/** @deprecated Use Scope1ReviewContent inside wizard shell. */
export function Scope1ReviewPage({
  quadrants,
  sectorLabel = 'Scope 1',
  busy,
  submitted,
  onBack,
  onSubmit,
  submitError,
}: {
  quadrants: Scope1ReviewQuadrants
  sectorLabel?: string
  busy: boolean
  submitted: boolean
  onBack: () => void
  onSubmit: () => void
  submitError?: string | null
}) {
  if (submitted) {
    return <Scope1ReviewSubmittedScreen sectorLabel={sectorLabel} />
  }

  return (
    <main className="wizard-app">
      <section className="wizard-main">
        <Scope1ReviewContent
          quadrants={quadrants}
          busy={busy}
          onBack={onBack}
          onSubmit={onSubmit}
          submitError={submitError}
        />
      </section>
    </main>
  )
}

/** Read-only admin grid (same 2×2 layout, no submit). */
export function Scope1ReviewGridReadOnly({
  quadrants,
  header,
  footer,
}: {
  quadrants: Scope1ReviewQuadrants
  header?: ReactNode
  footer?: ReactNode
}) {
  return (
    <main className="wizard-app">
      <section className="wizard-main review-step-page">
        {header}
        <ReviewQuadrantGrid quadrants={quadrants} />
        {footer}
      </section>
    </main>
  )
}
