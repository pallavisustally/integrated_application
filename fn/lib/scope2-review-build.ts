import type { ReviewField } from '@/components/review/review-primitives'

const fmt = (v: unknown, digits = 2): string => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''))
  if (Number.isNaN(n)) return '-'
  return n.toFixed(digits)
}

export function scope2CalculationSummaryFields(data: Record<string, unknown>): ReviewField[] {
  return [
    {
      label: 'Grid emission factor',
      value: data.gridEmissionFactor != null ? `${fmt(data.gridEmissionFactor, 3)} kg CO2e/kWh` : '-',
    },
    {
      label: 'Location-based emissions',
      value: data.locationBasedEmissions != null ? `${fmt(data.locationBasedEmissions)} tCO2e` : '-',
    },
    {
      label: 'Market-based emissions',
      value: data.marketBasedEmissions != null ? `${fmt(data.marketBasedEmissions)} tCO2e` : '-',
      subLabel: 'Primary Scope 2 total',
    },
    {
      label: 'Electricity purchased (annual)',
      value: data.electricityPurchased != null ? `${fmt(data.electricityPurchased)} kWh` : '-',
    },
    {
      label: 'Grid energy consumption',
      value: data.energyConsumption != null ? `${fmt(data.energyConsumption)} GJ` : '-',
    },
    {
      label: 'Renewable energy consumption',
      value: data.renewableEnergyConsumption != null ? `${fmt(data.renewableEnergyConsumption)} GJ` : '-',
    },
  ]
}

export function scope2CalculationBreakdownFields(data: Record<string, unknown>): ReviewField[] {
  const energyGrid = data.energyGrid != null ? Number(data.energyGrid) : null
  const energyRenew = data.energyRenew != null ? Number(data.energyRenew) : null
  const energyTotal = data.energyTotal != null ? Number(data.energyTotal) : null

  const kwhFromKj = (kj: number | null) =>
    kj != null && !Number.isNaN(kj) ? `${(kj / 3_600_000).toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh` : '-'

  const fields: ReviewField[] = [
    {
      label: 'Total electricity (energy basis)',
      value: energyTotal != null ? kwhFromKj(energyTotal) : '-',
    },
    {
      label: 'Grid share (energy basis)',
      value: energyGrid != null ? kwhFromKj(energyGrid) : '-',
    },
    {
      label: 'Renewable share (energy basis)',
      value: energyRenew != null ? kwhFromKj(energyRenew) : '-',
    },
  ]

  if (data.trackingType === 'Spend amount' && data.spendAmount) {
    fields.push({ label: 'Spend-based estimate', value: `${data.spendAmount} INR`, fullWidth: true })
  }

  if (data.energyIntensityPerRupee) {
    fields.push({
      label: 'Site turnover (intensity denominator)',
      value: `${data.energyIntensityPerRupee} INR`,
    })
  }

  if (data.onsiteExportedKwh) {
    fields.push({
      label: 'On-site export / net metering',
      value: `${fmt(data.onsiteExportedKwh)} kWh`,
    })
  }

  return fields
}
