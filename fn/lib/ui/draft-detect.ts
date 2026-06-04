export type CalculatorSector = 'cement' | 'oil_gas' | 'pulp_paper' | 'iron_steel' | 'power'

const KEYS: Record<CalculatorSector, string> = {
  cement: 'sustally-cement-draft-v1',
  oil_gas: 'sustally-oilgas-draft-v1',
  pulp_paper: 'sustally:pulppaper:draft:v1',
  iron_steel: 'sustally:ironsteel:draft:v1',
  power: 'sustally:power:draft:v1',
}

export function sectorDraftLooksMeaningful(sector: CalculatorSector): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem(KEYS[sector])
    if (!raw) return false
    const p = JSON.parse(raw) as Record<string, unknown>
    const org = p?.organization as { name?: string } | undefined
    if (org?.name?.trim()) return true
    const a = p?.activityData as Record<string, unknown> | undefined
    if (!a) return false
    if (sector === 'cement') {
      return Boolean(
        (a.kilnFuels as unknown[])?.length ||
          (a.nonKilnFuels as unknown[])?.length ||
          (a.mobile as unknown[])?.length ||
          (a.fugitive as unknown[])?.length ||
          (a.production as { clinkerProducedTonnes?: number | null })?.clinkerProducedTonnes != null,
      )
    }
    if (sector === 'oil_gas') {
      return Boolean(
        (a.stationaryCombustion as unknown[])?.length ||
          (a.mobileCombustion as unknown[])?.length ||
          (a.flaring as unknown[])?.length ||
          (a.venting as unknown[])?.length ||
          (a.fugitiveComponents as unknown[])?.length ||
          (a.refrigerants as unknown[])?.length ||
          (a.process as unknown[])?.length,
      )
    }
    if (sector === 'iron_steel') {
      return Boolean(
        (a.stationaryCombustion as unknown[])?.length ||
          (a.mobile as unknown[])?.length ||
          (a.cokeOven as unknown[])?.length ||
          (a.sinter as unknown[])?.length ||
          (a.dri as unknown[])?.length ||
          (a.bfBof as unknown[])?.length ||
          (a.eaf as unknown[])?.length ||
          (a.limeKiln as unknown[])?.length,
      )
    }
    if (sector === 'power') {
      return Boolean(
        (a.stationaryCombustion as unknown[])?.length ||
          (a.mobile as unknown[])?.length,
      )
    }
    return Boolean(
      (a.stationaryCombustion as unknown[])?.length ||
        (a.biomassCombustion as unknown[])?.length ||
        (a.mobile as unknown[])?.length ||
        (a.landfills as unknown[])?.length ||
        (a.refrigerants as unknown[])?.length,
    )
  } catch {
    return false
  }
}

export const SECTOR_SWITCH_MESSAGE =
  'Switching sector opens a different calculator. Your current sector draft is saved in this browser, but unsaved work on screen will be lost. Continue?'
