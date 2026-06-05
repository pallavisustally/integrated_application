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
  kilnFuels: 'Kiln fuels',
  nonKilnFuels: 'Non-kiln fuels',
  fugitive: 'Fugitive',
}

export function categoryLabel(key: string): string {
  return SECTOR_CATEGORY_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
}

export function formatNumber(value: number, maximumFractionDigits = 2): string {
  return value.toLocaleString(typeof navigator !== 'undefined' ? navigator.language : 'en', {
    maximumFractionDigits,
  })
}
