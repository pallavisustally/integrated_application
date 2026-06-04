import type { FuelCombustionMethod, InputPayload, MethodSelections, MobileCombustionMethod } from '@/lib/engine/types'
import type { OilGasInputPayload } from '@/lib/engine/oilgas'
import type { PulpPaperInputPayload } from '@/lib/engine/pulppaper'

export type MethodProfileOption = {
  id: string
  title: string
  description: string
  when: string
  recommended?: boolean
}

/* ------------------------------- cement ----------------------------------- */

export const CEMENT_PROFILES: MethodProfileOption[] = [
  {
    id: 'standard-csi',
    title: 'Standard CSI inventory',
    description: 'CSI clinker-based process CO2, default clinker EF (0.525), IPCC dust fallback, energy-based fuels.',
    when: 'Most integrated plants with clinker production data and fuel quantities.',
    recommended: true,
  },
  {
    id: 'plant-specific',
    title: 'Plant-specific chemistry',
    description: 'Lab-measured CaO/MgO clinker EF, actual dust data, and plant-specific raw meal TOC where available.',
    when: 'You have kiln chemistry, dust, and TOC lab results (Tier 2/3).',
  },
  {
    id: 'epa-fallback',
    title: 'US EPA cement fallback',
    description: 'Conservative cement-based process estimate when CSI clinker data is unavailable.',
    when: 'Only clinker/cement production totals are available, not full kiln chemistry.',
  },
  {
    id: 'expert',
    title: 'Expert / custom',
    description: 'Configure every method field manually. Use when you need non-standard combinations.',
    when: 'Assurance or engineering review requires explicit method-by-method control.',
  },
]

export function applyCementProfile(ms: MethodSelections, profileId: string): MethodSelections {
  const base = { ...ms }
  if (profileId === 'standard-csi') {
    return {
      ...base,
      processEmissionMethod: 'CSI_CLINKER_BASED',
      clinkerEmissionFactorMethod: 'CSI_DEFAULT_525',
      dustMethod: 'IPCC_2_PERCENT_FALLBACK',
      tocMethod: 'CSI_DEFAULT_TOC',
      fuelCombustionMethod: 'ENERGY_BASED',
      mobileCombustionMethod: 'FUEL_BASED',
    }
  }
  if (profileId === 'plant-specific') {
    return {
      ...base,
      processEmissionMethod: 'CSI_CLINKER_BASED',
      clinkerEmissionFactorMethod: 'PLANT_SPECIFIC_CAO_MGO',
      dustMethod: 'ACTUAL_DUST_DATA',
      tocMethod: 'PLANT_SPECIFIC_TOC',
      fuelCombustionMethod: 'ENERGY_BASED',
      mobileCombustionMethod: 'FUEL_BASED',
    }
  }
  if (profileId === 'epa-fallback') {
    return {
      ...base,
      processEmissionMethod: 'US_EPA_CEMENT_BASED_FALLBACK',
      clinkerEmissionFactorMethod: 'CSI_DEFAULT_525',
      dustMethod: 'NOT_APPLICABLE',
      tocMethod: 'NOT_APPLICABLE',
      fuelCombustionMethod: 'ENERGY_BASED',
      mobileCombustionMethod: 'FUEL_BASED',
    }
  }
  return base
}

export function profileTitle(profiles: MethodProfileOption[], profileId: string): string {
  return profiles.find((p) => p.id === profileId)?.title ?? 'Expert / custom'
}

export function detectCementProfile(ms: MethodSelections): string {
  if (ms.processEmissionMethod === 'US_EPA_CEMENT_BASED_FALLBACK') return 'epa-fallback'
  if (
    ms.processEmissionMethod === 'CSI_CLINKER_BASED' &&
    ms.clinkerEmissionFactorMethod === 'PLANT_SPECIFIC_CAO_MGO'
  ) {
    return 'plant-specific'
  }
  if (
    ms.processEmissionMethod === 'CSI_CLINKER_BASED' &&
    ms.clinkerEmissionFactorMethod === 'CSI_DEFAULT_525' &&
    ms.dustMethod === 'IPCC_2_PERCENT_FALLBACK' &&
    ms.tocMethod === 'CSI_DEFAULT_TOC' &&
    ms.fuelCombustionMethod === 'ENERGY_BASED'
  ) {
    return 'standard-csi'
  }
  return 'expert'
}

export const CEMENT_METHOD_LABELS: Record<string, Record<string, string>> = {
  processEmissionMethod: {
    CSI_CLINKER_BASED: 'CSI clinker-based',
    US_EPA_CEMENT_BASED_FALLBACK: 'US EPA cement-based fallback',
  },
  clinkerEmissionFactorMethod: {
    PLANT_SPECIFIC_CAO_MGO: 'Plant-specific CaO/MgO',
    CSI_DEFAULT_525: 'CSI default 0.525 tCO2/t clinker',
    IPCC_DEFAULT_510: 'IPCC default 0.510 tCO2/t clinker',
  },
  dustMethod: {
    ACTUAL_DUST_DATA: 'Actual CKD and bypass dust data',
    IPCC_2_PERCENT_FALLBACK: 'IPCC 2% clinker fallback',
    NOT_APPLICABLE: 'Not applicable',
  },
  tocMethod: {
    CSI_DEFAULT_TOC: 'CSI default raw meal TOC',
    PLANT_SPECIFIC_TOC: 'Plant-specific raw meal TOC',
    NOT_APPLICABLE: 'Not applicable',
  },
  fuelCombustionMethod: {
    ENERGY_BASED: 'Energy-based (quantity x LHV x EF)',
    CARBON_CONTENT_BASED: 'Carbon-content-based',
    DIRECT_MEASUREMENT: 'Direct measurement (CEMS)',
  },
  mobileCombustionMethod: {
    FUEL_BASED: 'Fuel-based (preferred)',
    DISTANCE_BASED: 'Distance-based',
    EQUIPMENT_HOURS_BASED: 'Equipment hours',
  },
}

export function cementMethodLabel(field: string, value: string): string {
  return CEMENT_METHOD_LABELS[field]?.[value] ?? value.replace(/_/g, ' ').toLowerCase()
}

export function cementMethodSummary(ms: MethodSelections): string[] {
  return [
    `Process: ${cementMethodLabel('processEmissionMethod', ms.processEmissionMethod)}`,
    `Clinker EF: ${cementMethodLabel('clinkerEmissionFactorMethod', ms.clinkerEmissionFactorMethod)}`,
    `Dust: ${cementMethodLabel('dustMethod', ms.dustMethod)}`,
    `Raw meal TOC: ${cementMethodLabel('tocMethod', ms.tocMethod)}`,
    `Stationary fuels: ${cementMethodLabel('fuelCombustionMethod', ms.fuelCombustionMethod)}`,
    `Mobile: ${cementMethodLabel('mobileCombustionMethod', ms.mobileCombustionMethod)}`,
  ]
}

/* ----------------------------- oil & gas ---------------------------------- */

export const OIL_GAS_PROFILES: MethodProfileOption[] = [
  {
    id: 'standard-ipieca',
    title: 'Standard IPIECA / API',
    description: 'Energy-based stationary combustion and fuel-based mobile (default Tier 2 approach).',
    when: 'Typical upstream, midstream, or downstream sites with fuel use data.',
    recommended: true,
  },
  {
    id: 'cems-stationary',
    title: 'CEMS stationary',
    description: 'Direct measurement for stacks and fuel-based mobile.',
    when: 'Continuous emissions monitoring on major combustion sources.',
  },
  {
    id: 'carbon-tier3',
    title: 'Carbon-content (Tier 3)',
    description: 'Carbon-content-based stationary and fuel-based mobile.',
    when: 'Fuel carbon content is lab-verified per stream.',
  },
  {
    id: 'expert',
    title: 'Expert / custom',
    description: 'Set stationary, mobile, and GWP basis field by field.',
    when: 'Non-standard reporting or dual GWP disclosure.',
  },
]

export function applyOilGasMethods(
  payload: OilGasInputPayload,
  profileId: string,
): Pick<OilGasInputPayload['methodSelections'], 'stationaryCombustionMethod' | 'mobileCombustionMethod'> {
  if (profileId === 'cems-stationary') {
    return { stationaryCombustionMethod: 'DIRECT_MEASUREMENT', mobileCombustionMethod: 'FUEL_BASED' }
  }
  if (profileId === 'carbon-tier3') {
    return { stationaryCombustionMethod: 'CARBON_CONTENT_BASED', mobileCombustionMethod: 'FUEL_BASED' }
  }
  if (profileId === 'standard-ipieca') {
    return { stationaryCombustionMethod: 'ENERGY_BASED', mobileCombustionMethod: 'FUEL_BASED' }
  }
  return {
    stationaryCombustionMethod: payload.methodSelections.stationaryCombustionMethod,
    mobileCombustionMethod: payload.methodSelections.mobileCombustionMethod,
  }
}

export function detectOilGasProfile(ms: OilGasInputPayload['methodSelections']): string {
  if (ms.stationaryCombustionMethod === 'DIRECT_MEASUREMENT' && ms.mobileCombustionMethod === 'FUEL_BASED') {
    return 'cems-stationary'
  }
  if (ms.stationaryCombustionMethod === 'CARBON_CONTENT_BASED' && ms.mobileCombustionMethod === 'FUEL_BASED') {
    return 'carbon-tier3'
  }
  if (ms.stationaryCombustionMethod === 'ENERGY_BASED' && ms.mobileCombustionMethod === 'FUEL_BASED') {
    return 'standard-ipieca'
  }
  return 'expert'
}

const COMBUSTION_LABELS: Record<FuelCombustionMethod, string> = {
  ENERGY_BASED: 'Energy-based (fuel x NCV x EF)',
  CARBON_CONTENT_BASED: 'Carbon-content-based',
  DIRECT_MEASUREMENT: 'Direct measurement (CEMS)',
}

const MOBILE_LABELS: Record<MobileCombustionMethod, string> = {
  FUEL_BASED: 'Fuel-based (preferred)',
  DISTANCE_BASED: 'Distance-based',
  EQUIPMENT_HOURS_BASED: 'Equipment hours',
}

export function oilGasMethodSummary(ms: OilGasInputPayload['methodSelections'], gwpSet: string): string[] {
  return [
    `Stationary: ${COMBUSTION_LABELS[ms.stationaryCombustionMethod]}`,
    `Mobile: ${MOBILE_LABELS[ms.mobileCombustionMethod]}`,
    `GWP basis: ${gwpSet.replace(/_/g, ' ')}`,
  ]
}

/* ----------------------------- pulp & paper ------------------------------- */

export const PULP_PAPER_PROFILES: MethodProfileOption[] = [
  {
    id: 'standard-tier2',
    title: 'Standard Tier 2 (ICFPA)',
    description: 'Energy-based stationary combustion and fuel-based mobile.',
    when: 'Typical kraft, recycled, or integrated mills with fuel quantities.',
    recommended: true,
  },
  {
    id: 'cems-stationary',
    title: 'CEMS stationary',
    description: 'Direct measurement for major stacks; fuel-based mobile.',
    when: 'Recovery furnaces or power boilers have CEMS coverage.',
  },
  {
    id: 'expert',
    title: 'Expert / custom',
    description: 'Configure stationary and mobile methods manually.',
    when: 'Assurance requires explicit method documentation.',
  },
]

export function applyPulpPaperMethods(
  ms: PulpPaperInputPayload['methodSelections'],
  profileId: string,
): PulpPaperInputPayload['methodSelections'] {
  const base = { ...ms }
  if (profileId === 'cems-stationary') {
    return { ...base, stationaryMethod: 'DIRECT_MEASUREMENT', mobileMethod: 'FUEL_BASED' }
  }
  if (profileId === 'standard-tier2') {
    return { ...base, stationaryMethod: 'ENERGY_BASED', mobileMethod: 'FUEL_BASED' }
  }
  return base
}

export function detectPulpPaperProfile(ms: PulpPaperInputPayload['methodSelections']): string {
  if (ms.stationaryMethod === 'DIRECT_MEASUREMENT' && ms.mobileMethod === 'FUEL_BASED') return 'cems-stationary'
  if (ms.stationaryMethod === 'ENERGY_BASED' && ms.mobileMethod === 'FUEL_BASED') return 'standard-tier2'
  return 'expert'
}

export function pulpPaperMethodSummary(ms: PulpPaperInputPayload['methodSelections']): string[] {
  return [
    `Stationary: ${COMBUSTION_LABELS[ms.stationaryMethod as FuelCombustionMethod] ?? ms.stationaryMethod}`,
    `Mobile: ${MOBILE_LABELS[ms.mobileMethod as MobileCombustionMethod] ?? ms.mobileMethod}`,
  ]
}
