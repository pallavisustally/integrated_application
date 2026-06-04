import { describe, expect, it } from 'vitest'

import { hasSignoffContact, signoffRows } from '@/lib/report/signoff'
import { applicabilityFlags, sourceApplicabilityComplete } from '@/lib/ui/source-catalog'
import { wizardStepLockReason } from '@/lib/ui/wizard-stepper'
import { compareGrossDelta } from '@/lib/ui/version-history'

describe('wizardStepLockReason', () => {
  it('requires organisation before facility step', () => {
    expect(
      wizardStepLockReason(3, { orgValid: false, facilityValid: false, hasResult: false }),
    ).toMatch(/Organisation/i)
  })
})

describe('sourceApplicabilityComplete', () => {
  it('requires exclusion reason when source is off', () => {
    const ok = sourceApplicabilityComplete(
      [{ key: 'mobile', label: 'Mobile' }],
      { mobile: false },
      {},
    )
    expect(ok).toBe(false)
  })
})

describe('signoff', () => {
  it('detects complete contact', () => {
    expect(
      hasSignoffContact({
        organization: { name: 'Co', contactName: 'A', contactEmail: 'a@b.co' },
      }),
    ).toBe(true)
  })

  it('exports rows for PDF/Excel', () => {
    const rows = signoffRows({
      organization: { name: 'Co', contactName: 'Pat', country: 'IN' },
      auditMetadata: { notes: 'Draft' },
    })
    expect(rows.some(([k]) => k === 'Prepared by')).toBe(true)
  })
})

describe('version compare', () => {
  it('computes percent delta', () => {
    expect(compareGrossDelta(100, 110)).toBeCloseTo(10, 1)
  })
})

describe('applicabilityFlags', () => {
  it('skips exclusionReasons key', () => {
    expect(
      applicabilityFlags({ mobile: true, exclusionReasons: { x: 'y' } }),
    ).toEqual({ mobile: true })
  })
})
