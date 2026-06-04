/** Map engine fieldPath prefixes to wizard activity category keys. */
const CEMENT_ACTIVITY_KEYS: Record<string, string> = {
  production: 'process',
  clinkerChemistry: 'process',
  dust: 'process',
  rawMeal: 'process',
  usEpaFallback: 'process',
  kilnFuels: 'stationary',
  nonKilnFuels: 'stationary',
  mobile: 'mobile',
  fugitive: 'fugitive',
  purchasedElectricity: 'process',
  boughtClinker: 'process',
  emissionRights: 'process',
  disclosedGrossScope1CO2Tonnes: 'process',
}

const OIL_GAS_ACTIVITY_KEYS: Record<string, string> = {
  production: 'production',
  stationaryCombustion: 'stationary',
  mobile: 'mobile',
  flaring: 'flaring',
  venting: 'venting',
  fugitiveComponents: 'fugitive',
  refrigerants: 'refrigerants',
  process: 'process',
  reported: 'reported',
  massBalance: 'production',
  disclosedGrossScope1CO2eTonnes: 'reported',
  disclosedScope1CO2Tonnes: 'reported',
  disclosedScope1CH4Tonnes: 'reported',
  disclosedScope1N2OTonnes: 'reported',
  disclosedScope2CO2eTonnes: 'reported',
}

const PULP_ACTIVITY_KEYS: Record<string, string> = {
  production: 'production',
  stationaryCombustion: 'stationary',
  biomassCombustion: 'biomass',
  limeKilns: 'limeKiln',
  makeupCarbonates: 'makeup',
  mobile: 'mobile',
  landfills: 'landfill',
  anaerobicWwt: 'wwt',
  refrigerants: 'refrigerant',
  chpAllocation: 'chp',
  co2Transfers: 'transfer',
  reported: 'reported',
  disclosedGrossScope1CO2eTonnes: 'reported',
}

export type WizardSectorNav = 'cement' | 'oil_gas' | 'pulp_paper'

export function activityCategoryFromFieldPath(
  sector: WizardSectorNav,
  fieldPath: string | undefined,
): string | null {
  if (!fieldPath) return null
  const m = fieldPath.match(/activityData\.([A-Za-z0-9_]+)/)
  if (!m) return null
  const key = m[1]
  const map =
    sector === 'cement'
      ? CEMENT_ACTIVITY_KEYS
      : sector === 'oil_gas'
        ? OIL_GAS_ACTIVITY_KEYS
        : PULP_ACTIVITY_KEYS
  return map[key] ?? null
}

export function fieldPathToDomId(fieldPath: string): string {
  return `fp-${fieldPath.replace(/[^a-zA-Z0-9._-]/g, '_')}`
}

export function scrollToFieldPath(fieldPath: string): void {
  if (typeof document === 'undefined') return
  const id = fieldPathToDomId(fieldPath)
  const el = document.getElementById(id) ?? document.querySelector(`[data-field-path="${fieldPath}"]`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (el instanceof HTMLElement && 'focus' in el) {
      const focusable = el.matches('input,select,textarea,button')
        ? el
        : el.querySelector<HTMLElement>('input,select,textarea')
      focusable?.focus({ preventScroll: true })
    }
  }
}
