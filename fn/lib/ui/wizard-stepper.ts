/** Shared copy for wizard top stepper when a step is not yet reachable. */

export type WizardGateContext = {
  orgValid: boolean
  facilityValid: boolean
  hasResult: boolean
  /** e.g. "Add facility name and value-chain segment on Facility & methods first." */
  facilityLockHint?: string
}

export function wizardStepLockReason(target: number, ctx: WizardGateContext): string | undefined {
  if (target <= 1) return undefined
  if (!ctx.orgValid && target >= 2) {
    return 'Company details from your booking are required before continuing.'
  }
  if (target >= 3 && !ctx.facilityValid) {
    return (
      ctx.facilityLockHint ??
      'Complete required facility fields on Facility & methods first.'
    )
  }
  if (target === 4 && !ctx.hasResult) {
    return 'Run Calculate Scope 1 on Activity data first.'
  }
  return undefined
}
