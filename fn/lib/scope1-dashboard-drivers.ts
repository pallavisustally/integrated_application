import { categoryLabel, cementComponentLabel } from '@/lib/ui/labels'

export type Scope1DriverGroup = { label: string; value: number; unit: 'tCO2' | 'tCO2e' }

export function buildScope1DriverGroups(result: Record<string, unknown>): Scope1DriverGroup[] {
  const scope1 = result.scope1 as Record<string, unknown> | undefined
  if (!scope1) return []

  const components = scope1.components as Record<string, number> | undefined
  if (components) {
    const processTotal =
      (components.clinkerCalcinationCO2Tonnes ?? 0) +
      (components.bypassDustCO2Tonnes ?? 0) +
      (components.ckdCO2Tonnes ?? 0) +
      (components.rawMealTocCO2Tonnes ?? 0)
    const combustionTotal =
      (components.conventionalKilnFuelCO2Tonnes ?? 0) +
      (components.alternativeFossilKilnFuelCO2Tonnes ?? 0) +
      (components.nonKilnFossilCO2Tonnes ?? 0) +
      (components.mobileCombustionCO2Tonnes ?? 0)
    const groups: Scope1DriverGroup[] = [
      { label: 'Process emissions', value: processTotal, unit: 'tCO2' },
      { label: 'Combustion', value: combustionTotal, unit: 'tCO2' },
      { label: 'Fugitive', value: components.fugitiveCO2eTonnes ?? 0, unit: 'tCO2e' },
    ]
    return groups.filter((g) => g.value > 0)
  }

  const byCategory = scope1.byCategory as Record<string, { co2eTonnes?: number }> | undefined
  if (byCategory) {
    return Object.entries(byCategory)
      .filter(([, g]) => (g?.co2eTonnes ?? 0) > 0)
      .map(([key, g]) => ({
        label: categoryLabel(key),
        value: g.co2eTonnes ?? 0,
        unit: 'tCO2e' as const,
      }))
      .slice(0, 8)
  }

  return []
}

export function grossScope1FromResult(result: Record<string, unknown>): number {
  const scope1 = result.scope1 as Record<string, unknown> | undefined
  if (!scope1) return 0
  const g =
    (scope1.grossScope1CO2Tonnes as number | undefined) ??
    (scope1.grossScope1CO2eTonnes as number | undefined)
  return typeof g === 'number' ? g : 0
}

const INTENSITY_LABELS: Record<string, { label: string; unit: string }> = {
  grossCO2PerTonneClinker: { label: 'Per tonne clinker', unit: 'kgCO2e/t' },
  grossCO2PerTonneCementitious: { label: 'Per tonne cementitious', unit: 'kgCO2e/t' },
  co2ePerMwhNet: { label: 'Per MWh net', unit: 'kgCO2e/MWh' },
  co2ePerBoe: { label: 'Per BOE', unit: 'kgCO2e/BOE' },
  co2ePerBblCrude: { label: 'Per bbl crude', unit: 'kgCO2e/bbl' },
  co2ePerTonneLng: { label: 'Per tonne LNG', unit: 'kgCO2e/t' },
  co2ePerMMscfThroughput: { label: 'Per MMscf throughput', unit: 'kgCO2e/MMscf' },
  methaneIntensityPercent: { label: 'Methane intensity', unit: '%' },
}

export function intensityMetricRows(
  result: Record<string, unknown>,
): Array<{ label: string; value: string; unit: string }> {
  const intensity = result.intensityMetrics as Record<string, number | null | undefined> | undefined
  if (!intensity) return []
  const rows: Array<{ label: string; value: string; unit: string }> = []
  for (const [key, meta] of Object.entries(INTENSITY_LABELS)) {
    const v = intensity[key]
    if (v != null && typeof v === 'number') {
      rows.push({
        label: meta.label,
        value: v.toLocaleString(undefined, { maximumFractionDigits: 4 }),
        unit: meta.unit,
      })
    }
  }
  return rows
}

/** @deprecated Use intensityMetricRows */
export const cementIntensityLabels = intensityMetricRows

export function calculationSummaryRows(result: Record<string, unknown>): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = []
  if (result.methodologyPack) {
    rows.push({ label: 'Methodology', value: String(result.methodologyPack) })
  }
  if (result.status) {
    rows.push({ label: 'Calculation status', value: String(result.status).replace(/_/g, ' ') })
  }
  const dq = (result.dataQuality as { overall?: string } | undefined)?.overall
  if (dq) rows.push({ label: 'Data quality', value: dq.replace(/_/g, ' ') })
  const errors = (result.errors as unknown[])?.length ?? 0
  const warnings = (result.warnings as unknown[])?.length ?? 0
  rows.push({ label: 'Validation', value: `${errors} error(s), ${warnings} warning(s)` })
  return rows
}

export function gasBreakdownRows(result: Record<string, unknown>): Array<{ label: string; value: string }> {
  const scope1 = result.scope1 as Record<string, unknown> | undefined
  const byGas = scope1?.byGas as Record<string, number> | undefined
  if (!byGas) return []
  const labels: Record<string, string> = {
    co2Tonnes: 'CO2',
    ch4Tonnes: 'CH4',
    ch4CO2eTonnes: 'CH4 (CO2e)',
    n2oTonnes: 'N2O',
    n2oCO2eTonnes: 'N2O (CO2e)',
    refrigerantCO2eTonnes: 'Refrigerants (CO2e)',
  }
  return Object.entries(byGas)
    .filter(([, v]) => typeof v === 'number' && v > 0)
    .map(([key, v]) => ({
      label: labels[key] || key,
      value: `${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })} t`,
    }))
}

export function breakdownRows(result: Record<string, unknown>): Array<{ label: string; value: string }> {
  const scope1 = result.scope1 as Record<string, unknown> | undefined
  if (!scope1) return []

  const components = scope1.components as Record<string, number> | undefined
  if (components) {
    return Object.entries(components).map(([key, val]) => {
      const { label, unit } = cementComponentLabel(key)
      return { label, value: `${Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}` }
    })
  }

  const byCategory = scope1.byCategory as Record<string, { co2eTonnes?: number }> | undefined
  if (byCategory) {
    return Object.entries(byCategory)
      .filter(([, g]) => (g?.co2eTonnes ?? 0) > 0)
      .map(([key, g]) => ({
        label: categoryLabel(key),
        value: `${(g.co2eTonnes ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} tCO2e`,
      }))
  }

  return []
}
