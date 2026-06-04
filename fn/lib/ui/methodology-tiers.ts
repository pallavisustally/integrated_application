export type TierStep = {
  tier: string
  dataNeeded: string
  method: string
  ifMissing: string
}

export const CEMENT_TIER_STEPS: TierStep[] = [
  {
    tier: 'Tier 3',
    dataNeeded: 'Lab CaO/MgO, actual dust masses, plant TOC',
    method: 'Plant-specific clinker EF, actual dust, plant TOC',
    ifMissing: 'Falls back to Tier 2 defaults with a validation warning',
  },
  {
    tier: 'Tier 2',
    dataNeeded: 'Clinker production (tonnes) and fuel quantities',
    method: 'CSI clinker-based process + energy-based combustion',
    ifMissing: 'Process may use US EPA cement-based fallback',
  },
  {
    tier: 'Tier 1',
    dataNeeded: 'Cement production only',
    method: 'US EPA cement-based fallback',
    ifMissing: 'Incomplete inventory - errors on calculate',
  },
]

export const OIL_GAS_TIER_STEPS: TierStep[] = [
  {
    tier: 'Tier 3',
    dataNeeded: 'CEMS, component leak surveys, measured flare/vent volumes',
    method: 'Direct measurement / component count with site EFs',
    ifMissing: 'Uses API/IPIECA default EFs with warnings',
  },
  {
    tier: 'Tier 2',
    dataNeeded: 'Fuel volumes, gas composition, segment-specific factors',
    method: 'Energy-based combustion + speciated flaring/venting',
    ifMissing: 'Falls back to generic combustion EFs',
  },
  {
    tier: 'Tier 1',
    dataNeeded: 'Disclosed annual Scope 1 total only',
    method: 'Reported / direct entry (reconciliation mode)',
    ifMissing: 'Cannot build category breakdown without activity data',
  },
]

export const PULP_TIER_STEPS: TierStep[] = [
  {
    tier: 'Tier 3',
    dataNeeded: 'CEMS, site NCV/EF overrides, LFG meters',
    method: 'Direct CO2 or measured biogas with overrides',
    ifMissing: 'Library NCASI/ICFPA defaults applied',
  },
  {
    tier: 'Tier 2',
    dataNeeded: 'Fuel and production quantities by technology',
    method: 'Energy-based stationary/mobile + landfill/WWT models',
    ifMissing: 'Warnings for missing technology-specific EFs',
  },
  {
    tier: 'Tier 1',
    dataNeeded: 'Disclosed gross Scope 1 only',
    method: 'Reported reconciliation against modelled total',
    ifMissing: 'Category detail unavailable',
  },
]
