/** Human-readable labels for inventory UI (codes stay in payloads). */

export const NUM_FIELD_PLACEHOLDER = 'Leave blank if unknown'

export function numFieldStatusHint(
  value: number | null,
  hint?: string,
): string {
  if (value === null) return 'Not provided - treated as missing data'
  if (value === 0) return 'Confirmed zero (verified actual)'
  return hint ?? ''
}

const FUEL_LABELS: Record<string, string> = {
  coal_bituminous: 'Bituminous coal',
  petcoke: 'Petroleum coke',
  lignite: 'Lignite',
  natural_gas: 'Natural gas',
  diesel: 'Diesel',
  heavy_fuel_oil: 'Heavy fuel oil',
  waste_oil: 'Waste oil',
  tyres: 'Tyres (alternative fuel)',
  waste_plastics: 'Waste plastics',
  mixed_industrial_waste: 'Mixed industrial waste',
  solid_biomass: 'Solid biomass',
  meat_bone_meal: 'Meat & bone meal',
  dried_sewage_sludge: 'Dried sewage sludge',
  solvents: 'Solvents',
  agricultural_residue: 'Agricultural residue',
  refinery_fuel_gas: 'Refinery fuel gas',
  lpg: 'LPG',
  crude_oil: 'Crude oil',
  motor_gasoline: 'Motor gasoline',
  jet_kerosene: 'Jet kerosene',
  biodiesel: 'Biodiesel',
  black_liquor: 'Black liquor',
  wood_bark: 'Wood bark / hog fuel',
  residual_oil: 'Residual fuel oil',
  bituminous_coal: 'Bituminous coal',
  sub_bituminous_coal: 'Sub-bituminous coal',
  anthracite: 'Anthracite',
  peat: 'Peat',
  coke_oven_gas: 'Coke oven gas',
  gasoline: 'Gasoline',
  kerosene: 'Kerosene',
  biogas: 'Biogas',
}

export function fuelLabel(code: string): string {
  return FUEL_LABELS[code] ?? code.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const GAS_LABELS: Record<string, string> = {
  r22: 'R-22 (HCFC-22)',
  r32: 'R-32',
  r134a: 'R-134a',
  r404a: 'R-404A',
  r407c: 'R-407C',
  r410a: 'R-410A',
  r507a: 'R-507A',
  r23: 'R-23',
  sf6: 'SF6',
}

export function gasLabel(code: string): string {
  return GAS_LABELS[code] ?? code.toUpperCase()
}

export const BOUNDARY_METHOD_LABELS: Record<string, string> = {
  OPERATIONAL_CONTROL: 'Operational control',
  FINANCIAL_CONTROL: 'Financial control',
  EQUITY_SHARE: 'Equity share',
}

export const CEMENT_SCOPE1_COMPONENT_LABELS: Record<string, { label: string; unit: 'tCO2' | 'tCO2e' }> = {
  clinkerCalcinationCO2Tonnes: { label: 'Clinker calcination', unit: 'tCO2' },
  bypassDustCO2Tonnes: { label: 'Bypass dust', unit: 'tCO2' },
  ckdCO2Tonnes: { label: 'Cement kiln dust (CKD)', unit: 'tCO2' },
  rawMealTocCO2Tonnes: { label: 'Raw meal TOC', unit: 'tCO2' },
  conventionalKilnFuelCO2Tonnes: { label: 'Conventional kiln fuel', unit: 'tCO2' },
  alternativeFossilKilnFuelCO2Tonnes: { label: 'Alternative fossil kiln fuel', unit: 'tCO2' },
  nonKilnFossilCO2Tonnes: { label: 'Non-kiln fossil fuel', unit: 'tCO2' },
  mobileCombustionCO2Tonnes: { label: 'Mobile combustion', unit: 'tCO2' },
  fugitiveCO2eTonnes: { label: 'Fugitive emissions', unit: 'tCO2e' },
}

export function cementComponentLabel(key: string): { label: string; unit: 'tCO2' | 'tCO2e' } {
  return (
    CEMENT_SCOPE1_COMPONENT_LABELS[key] ?? {
      label: key.replace(/CO2e?Tonnes$/, '').replace(/([A-Z])/g, ' $1').trim(),
      unit: key.includes('CO2e') ? 'tCO2e' : 'tCO2',
    }
  )
}

const SECTOR_CATEGORY_LABELS: Record<string, string> = {
  stationaryCombustion: 'Stationary combustion',
  mobileCombustion: 'Mobile combustion',
  mobile: 'Mobile combustion',
  flaring: 'Flaring',
  venting: 'Venting',
  fugitiveComponents: 'Fugitive components',
  refrigerants: 'Refrigerants',
  process: 'Process',
  reported: 'Reported / disclosed',
  biomassCombustion: 'Biomass combustion (memo)',
  limeKilns: 'Lime kilns',
  makeupCarbonates: 'Make-up carbonates',
  landfills: 'Landfills',
  anaerobicWwt: 'Anaerobic wastewater',
  chpAllocation: 'CHP allocation',
  co2Transfers: 'CO2 transfers',
}

export function categoryLabel(key: string): string {
  return SECTOR_CATEGORY_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
}
