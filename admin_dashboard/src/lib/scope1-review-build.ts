import {
  BOUNDARY_METHOD_LABELS,
  categoryLabel,
  cementComponentLabel,
  formatNumber,
} from '@/lib/scope1-labels'

import type { ReviewCardData, ReviewField } from '@/components/review/review-primitives'

const fmt = (v: number) => formatNumber(v, 2)

export type Scope1ReviewQuadrants = {
  orgBoundary: ReviewCardData
  activity: ReviewCardData
  calcSummary: ReviewCardData
  calcBreakdown: ReviewCardData
}

function str(v: unknown, fallback = 'Not specified'): string {
  if (v === null || v === undefined || v === '') return fallback
  return String(v)
}

function grossFromResult(result: Record<string, unknown>): number {
  const scope1 = result.scope1 as Record<string, unknown> | undefined
  if (!scope1) return 0
  const g =
    (scope1.grossScope1CO2Tonnes as number | undefined) ??
    (scope1.grossScope1CO2eTonnes as number | undefined)
  return typeof g === 'number' ? g : 0
}

function componentFields(result: Record<string, unknown>): ReviewField[] {
  const scope1 = result.scope1 as Record<string, unknown> | undefined
  if (!scope1) return [{ label: 'Components', value: '-' }]

  const components = scope1.components as Record<string, number> | undefined
  if (components && typeof components === 'object') {
    return Object.entries(components).map(([key, val]) => {
      const { label, unit } = cementComponentLabel(key)
      return { label, value: `${fmt(Number(val))} ${unit}` }
    })
  }

  const byCategory = scope1.byCategory as Record<string, { co2eTonnes?: number }> | undefined
  if (byCategory && typeof byCategory === 'object') {
    return Object.entries(byCategory)
      .filter(([, g]) => g && typeof g.co2eTonnes === 'number' && g.co2eTonnes > 0)
      .map(([key, g]) => ({
        label: categoryLabel(key),
        value: `${fmt(g.co2eTonnes ?? 0)} tCO2e`,
      }))
  }

  return [{ label: 'Breakdown', value: 'No line items' }]
}

function activitySummaryFields(payload: Record<string, unknown>): ReviewField[] {
  const ad = payload.activityData as Record<string, unknown> | undefined
  if (!ad) return [{ label: 'Activity data', value: 'Not specified' }]

  const rows: ReviewField[] = []
  for (const [key, val] of Object.entries(ad)) {
    if (Array.isArray(val)) {
      if (val.length > 0) {
        rows.push({ label: categoryLabel(key), value: `${val.length} row${val.length === 1 ? '' : 's'}` })
      }
    } else if (val && typeof val === 'object') {
      const prod = val as Record<string, unknown>
      for (const [pk, pv] of Object.entries(prod)) {
        if (typeof pv === 'number' && pv > 0) {
          rows.push({
            label: `${categoryLabel(key)} — ${pk.replace(/([A-Z])/g, ' $1').trim()}`,
            value: fmt(pv),
          })
        }
      }
    } else if (typeof val === 'number' && val > 0) {
      rows.push({ label: categoryLabel(key), value: fmt(val) })
    }
  }

  return rows.length ? rows : [{ label: 'Activity data', value: 'No quantities entered' }]
}

function cementActivityFields(payload: Record<string, unknown>): ReviewField[] {
  const ad = payload.activityData as Record<string, unknown> | undefined
  if (!ad) return activitySummaryFields(payload)

  const prod = ad.production as Record<string, number> | undefined
  const rows: ReviewField[] = []

  if (prod?.clinkerProducedTonnes != null) {
    rows.push({ label: 'Clinker produced', value: `${fmt(prod.clinkerProducedTonnes)} t` })
  }
  if (prod?.cementitiousProducedTonnes != null) {
    rows.push({ label: 'Cementitious production', value: `${fmt(prod.cementitiousProducedTonnes)} t` })
  }

  const fuels = ['kilnFuels', 'nonKilnFuels', 'mobile', 'fugitive'] as const
  for (const key of fuels) {
    const arr = ad[key] as unknown[] | undefined
    if (arr?.length) {
      rows.push({ label: categoryLabel(key), value: `${arr.length} entries` })
    }
  }

  if (ad.disclosedGrossScope1CO2Tonnes != null) {
    rows.push({
      label: 'Disclosed gross Scope 1',
      value: `${fmt(Number(ad.disclosedGrossScope1CO2Tonnes))} tCO2`,
    })
  }

  return rows.length ? rows : activitySummaryFields(payload)
}

export function buildScope1ReviewQuadrants(
  payload: Record<string, unknown>,
  result: Record<string, unknown>,
  sectorCode?: string,
): Scope1ReviewQuadrants {
  const org = payload.organization as Record<string, unknown> | undefined
  const facility = payload.facility as Record<string, unknown> | undefined
  const boundary = payload.organizationBoundary as Record<string, unknown> | undefined
  const ctx = payload.calculationContext as { reportingPeriod?: { year?: number }; gwpSet?: string } | undefined
  const gross = grossFromResult(result)
  const sector = sectorCode || (payload.sectorCode as string) || 'SCOPE_1'

  const orgFields: ReviewField[] = [
    { label: 'Organization', value: str(org?.name) },
    { label: 'Country', value: str(org?.country) },
    { label: 'Contact', value: str(org?.contactName, '-') },
    { label: 'Email', value: str(org?.contactEmail, '-') },
    { label: 'Facility', value: str(facility?.name) },
    { label: 'State / city', value: `${str(facility?.state, '-')} / ${str(facility?.city, '-')}` },
    {
      label: 'Reporting year',
      value: ctx?.reportingPeriod?.year ? `FY ${ctx.reportingPeriod.year}` : 'Not specified',
    },
    { label: 'GWP set', value: str(ctx?.gwpSet, 'AR6') },
    {
      label: 'Boundary method',
      value:
        BOUNDARY_METHOD_LABELS[String(boundary?.boundaryMethod)] ||
        str(boundary?.boundaryMethod),
    },
    {
      label: 'Ownership / consolidation',
      value: `${str(boundary?.ownershipSharePercent, '-')}% / ${str(boundary?.consolidationPercent, '-')}%`,
    },
  ]

  const activityFields =
    sector === 'CEMENT' ? cementActivityFields(payload) : activitySummaryFields(payload)

  const status = str(result.status, '-')
  const dataQuality =
    (result.dataQuality as { overall?: string } | undefined)?.overall?.replace(/_/g, ' ') ?? '-'
  const errors = (result.errors as unknown[])?.length ?? 0
  const warnings = (result.warnings as unknown[])?.length ?? 0

  const calcSummaryFields: ReviewField[] = [
    { label: 'Gross Scope 1', value: `${fmt(gross)} tCO2e`, fullWidth: true },
    { label: 'Inventory status', value: status },
    { label: 'Data quality', value: dataQuality },
    { label: 'Validation', value: `${errors} error(s), ${warnings} warning(s)` },
    { label: 'Methodology', value: str(result.methodologyPack, '-') },
  ]

  const intensity = result.intensityMetrics as Record<string, number | null | undefined> | undefined
  if (intensity) {
    for (const [k, v] of Object.entries(intensity)) {
      if (v != null && typeof v === 'number') {
        calcSummaryFields.push({
          label: k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()),
          value: fmt(v),
        })
      }
    }
  }

  const memo = result.memoItems as { biomassCO2Tonnes?: number } | undefined
  if (memo?.biomassCO2Tonnes != null) {
    calcSummaryFields.push({
      label: 'Biomass CO2 (memo)',
      value: `${fmt(memo.biomassCO2Tonnes)} tCO2`,
    })
  }

  return {
    orgBoundary: {
      title: 'Organization & boundary',
      accentColor: '#6366f1',
      fields: orgFields,
    },
    activity: {
      title: 'Activity data entered',
      accentColor: '#f59e0b',
      fields: activityFields,
    },
    calcSummary: {
      title: 'Calculation summary',
      accentColor: '#10b981',
      fields: calcSummaryFields,
    },
    calcBreakdown: {
      title: 'Emission breakdown',
      accentColor: '#64748b',
      fields: componentFields(result),
    },
  }
}
