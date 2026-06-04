/** Inventory source definitions for the applicability checklist UI. */

export type InventorySourceDef = {
  key: string
  label: string
  hint?: string
  /** Auto-excluded for grinding units (cement kiln process sources). */
  grindingLocked?: boolean
}

export const CEMENT_INVENTORY_SOURCES: InventorySourceDef[] = [
  { key: 'clinkerCalcination', label: 'Clinker calcination', hint: 'Process CO2 from clinker production', grindingLocked: true },
  { key: 'bypassDust', label: 'Bypass dust', hint: 'Bypass dust carbonate emissions', grindingLocked: true },
  { key: 'ckd', label: 'Cement kiln dust (CKD)', grindingLocked: true },
  { key: 'rawMealToc', label: 'Raw meal TOC', grindingLocked: true },
  { key: 'kilnFuels', label: 'Kiln fuels', hint: 'Conventional and alternative kiln combustion' },
  { key: 'nonKilnFuels', label: 'Non-kiln fuels', hint: 'Stationary combustion outside the kiln' },
  { key: 'mobile', label: 'Mobile combustion', hint: 'Owned or operationally controlled fleet' },
  { key: 'fugitive', label: 'Fugitive emissions', hint: 'Refrigerants and SF6 (CO2e)' },
  { key: 'purchasedElectricity', label: 'Purchased electricity', hint: 'Supporting Scope 2 bucket only' },
  { key: 'boughtClinker', label: 'Bought / sold clinker', hint: 'Net clinker adjustment where applicable' },
]

export const OIL_GAS_INVENTORY_SOURCES: InventorySourceDef[] = [
  { key: 'stationaryCombustion', label: 'Stationary combustion' },
  { key: 'mobileCombustion', label: 'Mobile combustion' },
  { key: 'flaring', label: 'Flaring' },
  { key: 'venting', label: 'Venting' },
  { key: 'fugitiveComponents', label: 'Fugitive components', hint: 'Equipment leaks and pneumatic devices' },
  { key: 'refrigerants', label: 'Refrigerants', hint: 'HFC / PFC leakage (CO2e)' },
  { key: 'process', label: 'Process emissions', hint: 'SMR, glycol, and other process routes' },
  { key: 'reported', label: 'Reported / direct emissions', hint: 'CEMS or disclosed totals' },
  { key: 'purchasedElectricity', label: 'Purchased electricity', hint: 'Supporting Scope 2 bucket only' },
]

export const PULP_PAPER_INVENTORY_SOURCES: InventorySourceDef[] = [
  { key: 'stationaryCombustion', label: 'Stationary combustion' },
  { key: 'biomassCombustion', label: 'Biomass combustion', hint: 'Biogenic CO2 reported as memo only' },
  { key: 'limeKilns', label: 'Lime kilns' },
  { key: 'makeupCarbonates', label: 'Make-up carbonates' },
  { key: 'mobile', label: 'Mobile combustion' },
  { key: 'landfills', label: 'Landfills' },
  { key: 'anaerobicWwt', label: 'Anaerobic wastewater' },
  { key: 'refrigerants', label: 'Refrigerants' },
  { key: 'chpAllocation', label: 'CHP allocation' },
  { key: 'co2Transfers', label: 'CO2 transfers' },
  { key: 'reported', label: 'Reported / disclosed' },
  { key: 'purchasedElectricity', label: 'Purchased electricity', hint: 'Supporting Scope 2 bucket only' },
]

/** Boolean source flags from a sector applicability object (skips exclusionReasons). */
export function applicabilityFlags(app: object): Record<string, boolean> {
  const out: Record<string, boolean> = {}
  for (const [k, v] of Object.entries(app as Record<string, unknown>)) {
    if (k === 'exclusionReasons') continue
    if (typeof v === 'boolean') out[k] = v
  }
  return out
}

export function updateSourceApplicability<A extends { exclusionReasons?: Record<string, string> }>(
  app: A,
  key: string,
  included: boolean,
  reason: string,
): A {
  const next = { ...app, exclusionReasons: { ...(app.exclusionReasons ?? {}) } }
  ;(next as Record<string, boolean | Record<string, string> | undefined>)[key] = included
  if (included) delete next.exclusionReasons![key]
  else next.exclusionReasons![key] = reason
  return next
}

export function sourceApplicabilityComplete(
  sources: InventorySourceDef[],
  flags: Record<string, boolean | undefined>,
  reasons?: Record<string, string>,
): boolean {
  for (const { key } of sources) {
    if (flags[key] === false) {
      const reason = reasons?.[key]?.trim()
      if (!reason) return false
    }
  }
  return true
}
