'use client'

import { scope1Fetch, scope1SaveQuery } from '@/lib/scope1-api'
import { useScope1OrganizationPrefill } from '@/lib/use-scope1-organization-prefill'
import { useScope1BoundaryPrefill } from '@/lib/use-scope1-boundary-prefill'
import { lockScope1Calculation } from '@/lib/scope1-lock'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Factory,
  Flame,
  Fuel,
  Hexagon,
  Moon,
  Plus,
  Sun,
  Trash2,
  Truck,
  Wind,
} from 'lucide-react'

import type {
  CalculationResult,
  FuelCombustionMethod,
  FuelEntry,
  FugitiveEntry,
  InputPayload,
  MobileCombustionMethod,
  MobileEntry,
  TraceEntry,
} from '@/lib/engine/types'
import { fuelLabel, gasLabel } from '@/lib/ui/labels'
import {
  CEMENT_PROFILES,
  cementMethodSummary,
  detectCementProfile,
  profileTitle,
} from '@/lib/ui/methodology'
import { FactorOverridePanel } from '@/components/factor-override-panel'
import { CementMethodologyGuide } from '@/components/methodology-guide'
import { SourceApplicabilityPanel } from '@/components/source-applicability-panel'
import { WizardProgressNav } from '@/components/wizard-progress-nav'
import { ReportSignoffPanel } from '@/components/report-signoff-panel'
import { AccessibleNumField, AccessibleSelect, AccessibleTextField } from '@/lib/ui/form-fields'
import {
  applicabilityFlags,
  CEMENT_INVENTORY_SOURCES,
  sourceApplicabilityComplete,
  updateSourceApplicability,
} from '@/lib/ui/source-catalog'
import {
  ActivityDataShell,
  CalculationTracePanel,
  CementBreakdownCards,
  EmissionsDriverChart,
  FactorSnapshotsPanel,
  InventoryStatusBanner,
  LiveTotalsStrip,
  ResultsViewTabs,
  ActivityDataTools,
  listInventoryVersions,
  ReconciliationPanel,
  StickyExportBar,
  VersionHistoryPanel,
  type ActivityCategoryNav,
  type ResultsTab,
} from '@/components/wizard-shared'
import { saveInventoryVersion } from '@/lib/ui/version-history'
import { uploadActivityExcel } from '@/lib/activity-import/client'
import { mergeImportedActivity } from '@/lib/activity-import/parse-excel'
import { activityCategoryFromFieldPath, scrollToFieldPath } from '@/lib/ui/field-navigation'
import { ActivityEmptyState, EntryLabeledSelect, codesToOptions } from '@/lib/ui/activity-fields'
import { formatNumber } from '@/lib/ui/locale'

type Num = number | null
type Cat = 'process' | 'stationary' | 'mobile' | 'fugitive'

const STEPS = ['Sector', 'Facility & methods', 'Activity data', 'Review & report']

const FUEL_CODES = [
  'coal_bituminous',
  'petcoke',
  'lignite',
  'natural_gas',
  'diesel',
  'heavy_fuel_oil',
  'waste_oil',
  'tyres',
  'waste_plastics',
  'mixed_industrial_waste',
  'solid_biomass',
  // Heidelberg / Cemex / Holcim style alternative fuels
  'meat_bone_meal',
  'dried_sewage_sludge',
  'solvents',
  'agricultural_residue',
]

const GAS_CODES = ['r22', 'r32', 'r134a', 'r404a', 'r407c', 'r410a', 'r507a', 'r23', 'sf6']

/** Quantity units offered for mobile fuel entries (fuel-based method). */
const MOBILE_UNITS = ['L', 'gallon', 'kg', 'tonne', 'Sm3']

const CATEGORIES: { key: Cat; label: string; icon: typeof Flame }[] = [
  { key: 'process', label: 'Process', icon: Factory },
  { key: 'stationary', label: 'Stationary combustion', icon: Flame },
  { key: 'mobile', label: 'Mobile combustion', icon: Truck },
  { key: 'fugitive', label: 'Fugitive', icon: Wind },
]

const CEMENT_ACTIVITY_HINTS: Record<Cat, string> = {
  process: 'Production volumes, kiln chemistry, dust, and raw meal TOC tied to your Step 3 methodology profile.',
  stationary: 'Kiln and non-kiln fossil fuels. Biomass CO2 is reported separately as a memo item.',
  mobile: 'Owned or operationally controlled equipment only. Third-party transport is Scope 3.',
  fugitive: 'Refrigerant leakage and SF6 from switchgear, reported as CO2e using your selected GWP set.',
}

const fmt = (v: number) => formatNumber(v, 2)
const fmt4 = (v: number) => formatNumber(v, 4)

function sampleBharatCement(): InputPayload {
  return {
    calculationContext: {
      calculationType: 'ANNUAL_INVENTORY',
      reportingPeriod: { year: 2026, startDate: '2026-01-01', endDate: '2026-12-31' },
      inventoryVersion: 'SAMPLE_V1',
      gwpSet: 'AR6',
    },
    organization: {
      name: 'Bharat Cement Ltd (sample)',
      country: 'IN',
      contactName: 'Anita Sharma',
      contactEmail: 'anita.sharma@bharatcement.example',
      contactPhone: '+91 98000 00000',
      contactRole: 'Head of Sustainability',
    },
    facility: { name: 'Plant 1 — Rajasthan', facilityType: 'INTEGRATED_CEMENT', state: 'Rajasthan' },
    organizationBoundary: {
      boundaryMethod: 'OPERATIONAL_CONTROL',
      ownershipSharePercent: 100,
      consolidationPercent: 100,
    },
    sector: { sectorCode: 'CEMENT' },
    methodSelections: {
      processEmissionMethod: 'CSI_CLINKER_BASED',
      clinkerEmissionFactorMethod: 'CSI_DEFAULT_525',
      dustMethod: 'IPCC_2_PERCENT_FALLBACK',
      tocMethod: 'CSI_DEFAULT_TOC',
      fuelCombustionMethod: 'ENERGY_BASED',
      mobileCombustionMethod: 'FUEL_BASED',
      electricityMethod: 'LOCATION_BASED_SUPPORTING',
      boughtClinkerMethod: 'NONE',
      netReportingMethod: 'NONE',
    },
    sourceApplicability: {
      clinkerCalcination: true,
      bypassDust: true,
      ckd: true,
      rawMealToc: true,
      kilnFuels: true,
      nonKilnFuels: true,
      mobile: true,
      fugitive: true,
      purchasedElectricity: false,
      boughtClinker: false,
      exclusionReasons: {
        purchasedElectricity: 'Out of Scope 1 (Scope 2) - not collected in this calculator',
        boughtClinker: 'Out of Scope 1 (Scope 3) - not collected in this calculator',
      },
    },
    activityData: {
      production: {
        clinkerProducedTonnes: 1_200_000,
        cementProducedTonnes: 1_800_000,
        cementitiousProductTonnes: 1_900_000,
      },
      clinkerChemistry: { caoPercent: null, caoNonCarbonatePercent: null, mgoPercent: null, mgoNonCarbonatePercent: null },
      dust: { ckdLeavingKilnTonnes: null, ckdCalcinationRate: null, bypassDustLeavingKilnTonnes: null, bypassDustCalcinationRate: null },
      rawMeal: { rawMealToClinkerRatio: null, tocFraction: null },
      kilnFuels: [
        { id: 'k1', label: 'Kiln petcoke', fuelCode: 'petcoke', category: 'CONVENTIONAL_FOSSIL', quantity: 110_000, quantityUnit: 'tonne' },
        { id: 'k2', label: 'Kiln coal', fuelCode: 'coal_bituminous', category: 'CONVENTIONAL_FOSSIL', quantity: 95_000, quantityUnit: 'tonne' },
        { id: 'k3', label: 'Kiln tyres (alt fuel)', fuelCode: 'tyres', category: 'MIXED', quantity: 8_000, quantityUnit: 'tonne' },
      ],
      nonKilnFuels: [
        { id: 'n1', label: 'DG set diesel', fuelCode: 'diesel', category: 'CONVENTIONAL_FOSSIL', quantity: 250_000, quantityUnit: 'L' },
      ],
      mobile: [
        { id: 'm1', label: 'Haul trucks & loaders', ownership: 'OWNED_CONTROLLED', fuelCode: 'diesel', quantity: 480_000, quantityUnit: 'L' },
      ],
      fugitive: [
        { id: 'g1', label: 'Plant AC / chillers', gasCode: 'r410a', leakedKg: 350 },
        { id: 'g2', label: 'HV switchgear', gasCode: 'sf6', leakedKg: 12 },
      ],
      purchasedElectricity: { mwh: null, gridEfTco2PerMwh: null },
      boughtClinker: { externalClinkerBoughtTonnes: null, externalClinkerSoldTonnes: null },
      emissionRights: { acquiredTonnes: null },
      usEpaFallback: { cementProducedTonnes: null, clinkerToCementRatio: null, clinkerEfTco2PerTonne: null },
    },
    factorOverrides: {},
  }
}

function emptyPayload(): InputPayload {
  return {
    calculationContext: {
      calculationType: 'ANNUAL_INVENTORY',
      reportingPeriod: { year: 2026, startDate: '2026-01-01', endDate: '2026-12-31' },
      inventoryVersion: 'DRAFT_V1',
      gwpSet: 'AR6',
    },
    organization: { name: '', country: 'IN', contactName: '', contactEmail: '', contactPhone: '', contactRole: '' },
    facility: { name: '', facilityType: 'INTEGRATED_CEMENT', state: '' },
    organizationBoundary: {
      boundaryMethod: 'OPERATIONAL_CONTROL',
      ownershipSharePercent: 100,
      consolidationPercent: 100,
    },
    sector: { sectorCode: 'CEMENT' },
    methodSelections: {
      processEmissionMethod: 'CSI_CLINKER_BASED',
      clinkerEmissionFactorMethod: 'CSI_DEFAULT_525',
      dustMethod: 'NOT_APPLICABLE',
      tocMethod: 'CSI_DEFAULT_TOC',
      fuelCombustionMethod: 'ENERGY_BASED',
      mobileCombustionMethod: 'FUEL_BASED',
      electricityMethod: 'LOCATION_BASED_SUPPORTING',
      boughtClinkerMethod: 'NONE',
      netReportingMethod: 'NONE',
    },
    sourceApplicability: {
      clinkerCalcination: true,
      bypassDust: true,
      ckd: true,
      rawMealToc: true,
      kilnFuels: true,
      nonKilnFuels: true,
      mobile: true,
      fugitive: true,
      purchasedElectricity: false,
      boughtClinker: false,
      exclusionReasons: {
        purchasedElectricity: 'Out of Scope 1 (Scope 2) - not collected in this calculator',
        boughtClinker: 'Out of Scope 1 (Scope 3) - not collected in this calculator',
      },
    },
    activityData: {
      production: { clinkerProducedTonnes: null, cementProducedTonnes: null, cementitiousProductTonnes: null },
      clinkerChemistry: { caoPercent: null, caoNonCarbonatePercent: null, mgoPercent: null, mgoNonCarbonatePercent: null },
      dust: { ckdLeavingKilnTonnes: null, ckdCalcinationRate: null, bypassDustLeavingKilnTonnes: null, bypassDustCalcinationRate: null },
      rawMeal: { rawMealToClinkerRatio: null, tocFraction: null },
      kilnFuels: [],
      nonKilnFuels: [],
      mobile: [],
      fugitive: [],
      purchasedElectricity: { mwh: null, gridEfTco2PerMwh: null },
      boughtClinker: { externalClinkerBoughtTonnes: null, externalClinkerSoldTonnes: null },
      emissionRights: { acquiredTonnes: null },
      usEpaFallback: { cementProducedTonnes: null, clinkerToCementRatio: null, clinkerEfTco2PerTonne: null },
    },
    factorOverrides: {},
  }
}

/* ------------------------------ draft autosave --------------------------- */

const CEMENT_DRAFT_KEY = 'sustally-cement-draft-v1'

function saveCementDraft(p: InputPayload) {
  try {
    localStorage.setItem(CEMENT_DRAFT_KEY, JSON.stringify(p))
  } catch {
    /* storage unavailable — ignore */
  }
}

function loadCementDraft(): InputPayload | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CEMENT_DRAFT_KEY)
    if (!raw) return null
    const d = JSON.parse(raw)
    if (d?.sector?.sectorCode === 'CEMENT') return d as InputPayload
  } catch {
    /* corrupt draft — ignore */
  }
  return null
}

function cementDraftMeaningful(p: InputPayload): boolean {
  const a = p?.activityData
  return Boolean(
    p?.organization?.name?.trim() ||
      a?.kilnFuels?.length ||
      a?.nonKilnFuels?.length ||
      a?.mobile?.length ||
      a?.fugitive?.length ||
      a?.production?.clinkerProducedTonnes != null,
  )
}

function toNum(v: string): Num {
  if (v.trim() === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const CEMENT_GRINDING_LOCKED = ['clinkerCalcination', 'bypassDust', 'ckd', 'rawMealToc'] as const

function NumField(props: Parameters<typeof AccessibleNumField>[0]) {
  return <AccessibleNumField {...props} />
}

/* ----------------------- Scope badges & live previews --------------------- */

function fuelBadge(category: FuelEntry['category']) {
  if (category === 'BIOMASS')
    return <span className="entry-badge entry-badge-memo">Biomass memo (excluded)</span>
  if (category === 'MIXED')
    return <span className="entry-badge entry-badge-mixed">Gross Scope 1 + biomass memo</span>
  if (category === 'ALTERNATIVE_FOSSIL')
    return <span className="entry-badge entry-badge-s1">Gross Scope 1 (alt fossil)</span>
  return <span className="entry-badge entry-badge-s1">Gross Scope 1</span>
}
function mobileBadge(ownership: MobileEntry['ownership']) {
  return ownership === 'OWNED_CONTROLLED' ? (
    <span className="entry-badge entry-badge-s1">Gross Scope 1</span>
  ) : (
    <span className="entry-badge entry-badge-excl">Excluded (third-party)</span>
  )
}
const FUGITIVE_BADGE = <span className="entry-badge entry-badge-s1">Gross Scope 1 (CO2e)</span>

function findTraceOutput(trace: TraceEntry[] | undefined, predicate: (s: string) => boolean): number | null {
  if (!trace) return null
  const t = trace.find((e) => predicate(e.step))
  return t ? t.outputTonnesCO2 : null
}
function fuelRowCO2(trace: TraceEntry[] | undefined, label: string) {
  return findTraceOutput(trace, (s) => s === `Combustion CO2 - ${label}`)
}
function mobileRowCO2(trace: TraceEntry[] | undefined, label: string) {
  return findTraceOutput(trace, (s) => s === `Combustion CO2 - Mobile: ${label}`)
}
function fugitiveRowCO2(trace: TraceEntry[] | undefined, label: string) {
  return findTraceOutput(trace, (s) => s === `Fugitive - ${label}`)
}

/* --------------------------------- Wizard --------------------------------- */

export function Scope1Wizard({ onSwitchSector }: { onSwitchSector?: (s: 'cement' | 'oil_gas' | 'pulp_paper' | 'iron_steel' | 'power') => void }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [step, setStep] = useState(1)
  const [cat, setCat] = useState<Cat>('process')
  const [p, setP] = useState<InputPayload>(emptyPayload())
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [live, setLive] = useState<CalculationResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [step3Tried, setStep3Tried] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [submitted, setSubmitted] = useState(false)
  const [factors, setFactors] = useState<{
    constants: { factorCode: string; factorName: string; value: number; unit: string; source: string }[]
    gases: { gasCode: string; name: string; gwpAR5: number; gwpAR6: number }[]
  } | null>(null)

  useEffect(() => {
    scope1Fetch('/api/v1/factors')
      .then((r) => r.json())
      .then(setFactors)
      .catch(() => {})
  }, [])

  // Restore an autosaved draft after mount (kept out of the initial useState so
  // there's no SSR/hydration mismatch on theme- or GWP-dependent header chrome).
  useEffect(() => {
    try {
      const d = loadCementDraft()
      if (d && cementDraftMeaningful(d)) {
        setP(d)
        setHasDraft(true)
      }
    } catch {
      /* corrupt/partial draft — ignore rather than crash the app */
    }
  }, [])

  // Debounced live calculation - replaces /validate so we have the full result for
  // both validation messages AND live per-row / per-tab CO2 previews.
  useEffect(() => {
    if (step < 4) return
    const t = setTimeout(() => {
      scope1Fetch('/api/v1/calculations/cement/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      })
        .then((r) => r.json())
        .then((d) => setLive(d.result as CalculationResult))
        .catch(() => {})
    }, 400)
    return () => clearTimeout(t)
  }, [p, step])

  function patch(mut: (draft: InputPayload) => void) {
    setP((prev) => {
      const next: InputPayload = structuredClone(prev)
      mut(next)
      saveCementDraft(next)
      return next
    })
  }

  useScope1OrganizationPrefill(patch)
  useScope1BoundaryPrefill(patch)

  async function lockInventory() {
    if (!result?.calculationId) {
      alert('Save to database first, then submit for review.')
      return
    }
    setBusy(true)
    try {
      const out = await lockScope1Calculation(
        result.calculationId,
        p.organization.contactName || 'system',
      )
      if (!out.ok) {
        alert(`Submit failed: ${out.message}`)
        return
      }
      setSubmitted(true)
      alert('Inventory submitted for admin review.')
    } finally {
      setBusy(false)
    }
  }

  function startFresh() {
    try {
      localStorage.removeItem(CEMENT_DRAFT_KEY)
    } catch {
      /* ignore */
    }
    setP(emptyPayload())
    setHasDraft(false)
    setResult(null)
    setLive(null)
    setStep(1)
  }

  function navigateToField(fieldPath: string) {
    const category = activityCategoryFromFieldPath('cement', fieldPath)
    if (category) setCat(category as Cat)
    requestAnimationFrame(() => scrollToFieldPath(fieldPath))
  }

  function importActivityJson(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        const activity = parsed?.activityData ?? parsed
        if (!activity || typeof activity !== 'object') {
          setImportError('JSON must contain activityData or activity fields.')
          return
        }
        patch((d) => {
          d.activityData = { ...d.activityData, ...activity }
        })
        setImportError(null)
      } catch {
        setImportError('Could not parse activity JSON.')
      }
    }
    reader.readAsText(file)
  }

  async function importActivityExcel(file: File) {
    try {
      const data = await uploadActivityExcel('cement', file)
      patch((d) => {
        d.activityData = mergeImportedActivity(d.activityData, data.activityData)
      })
      setImportError(
        data.imported === 0
          ? 'No rows imported. Check category column matches template (kiln, non-kiln, mobile, fugitive).'
          : data.warnings.length > 0
            ? `Imported ${data.imported} row(s). ${data.warnings.join(' ')}`
            : null,
      )
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Excel import failed.')
    }
  }

  function fillSampleRowForCategory(category: Cat) {
    patch((d) => {
      const ad = d.activityData
      if (category === 'stationary') {
        if (ad.kilnFuels.length === 0) {
          ad.kilnFuels.push({
            id: crypto.randomUUID(),
            label: 'Main kiln',
            fuelCode: 'petcoke',
            category: 'CONVENTIONAL_FOSSIL',
            quantity: null,
            quantityUnit: 'tonne',
          })
        }
        return
      }
      if (category === 'mobile' && ad.mobile.length === 0) {
        ad.mobile.push({
          id: crypto.randomUUID(),
          label: 'Quarry truck',
          fuelCode: 'diesel',
          ownership: 'OWNED_CONTROLLED',
          quantity: null,
          quantityUnit: 'L',
        })
      }
      if (category === 'fugitive' && ad.fugitive.length === 0) {
        ad.fugitive.push({
          id: crypto.randomUUID(),
          label: 'Refrigerant / SF6',
          gasCode: 'r410a',
          leakedKg: null,
        })
      }
    })
  }

  function importJson(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        const payload = parsed?.inputPayload ?? parsed?.input ?? parsed
        if (payload?.sector?.sectorCode !== 'CEMENT') {
          setImportError('That file is not a Cement payload (expected sector CEMENT).')
          return
        }
        if (!payload.activityData || !payload.calculationContext) {
          setImportError('That file does not look like a calculator payload (missing activityData / calculationContext).')
          return
        }
        // Merge onto the empty template so any missing field gets a safe default
        // (a partial payload must never load a half-built, crash-prone state).
        const base = emptyPayload()
        const merged: InputPayload = {
          ...base,
          ...payload,
          calculationContext: { ...base.calculationContext, ...payload.calculationContext },
          organization: { ...base.organization, ...payload.organization },
          facility: { ...base.facility, ...payload.facility },
          organizationBoundary: { ...base.organizationBoundary, ...payload.organizationBoundary },
          methodSelections: { ...base.methodSelections, ...payload.methodSelections },
          sourceApplicability: { ...base.sourceApplicability, ...payload.sourceApplicability },
          activityData: { ...base.activityData, ...payload.activityData },
        }
        setImportError(null)
        setP(merged)
        saveCementDraft(merged)
        setHasDraft(true)
        setResult(null)
        setLive(null)
        setStep(3)
      } catch {
        setImportError('Could not parse that file as JSON.')
      }
    }
    reader.readAsText(file)
  }

  function commitResult(res: CalculationResult) {
    setResult(res)
    saveInventoryVersion('cement', {
      label: `FY ${res.reportingPeriod.year} calculate`,
      grossScope1: res.scope1.grossScope1CO2Tonnes,
      status: res.status,
      payload: p,
    })
    setStep(4)
  }

  async function runCalculate(save: boolean) {
    setBusy(true)
    try {
      const r = await scope1Fetch(`/api/v1/calculations/cement/calculate${save ? scope1SaveQuery(true) : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      })
      const data = await r.json()
      const res = data.result as CalculationResult
      if (data.calculationId && res) res.calculationId = data.calculationId
      commitResult(res)
    } finally {
      setBusy(false)
    }
  }

  async function loadSample() {
    const sample = sampleBharatCement()
    setP(sample)
    saveCementDraft(sample)
    setHasDraft(true)
    setBusy(true)
    try {
      const r = await scope1Fetch('/api/v1/calculations/cement/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sample),
      })
      const data = await r.json()
      commitResult(data.result as CalculationResult)
    } finally {
      setBusy(false)
    }
  }

  async function download(format: 'json' | 'xlsx' | 'pdf') {
    const r = await scope1Fetch('/api/v1/calculations/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: p, format }),
    })
    const blob = await r.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scope1-${p.facility.name || 'facility'}-FY${p.calculationContext.reportingPeriod.year}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const ms = p.methodSelections
  const ad = p.activityData
  const trace = live?.calculationTrace

  const gwpByGas = useMemo(() => {
    const map: Record<string, number> = {}
    if (factors) for (const g of factors.gases) map[g.gasCode] = p.calculationContext.gwpSet === 'AR6' ? g.gwpAR6 : g.gwpAR5
    return map
  }, [factors, p.calculationContext.gwpSet])

  // ---- step-level validation (gates both Continue buttons AND the top stepper)
  const orgValid = !!p.organization.name.trim()
  const facilityValid = !!p.facility.name.trim()
  const sourcesValid = useMemo(
    () =>
      sourceApplicabilityComplete(
        CEMENT_INVENTORY_SOURCES,
        applicabilityFlags(p.sourceApplicability),
        p.sourceApplicability.exclusionReasons,
      ),
    [p.sourceApplicability],
  )
  const canReach = (target: number): boolean => {
    if (target <= 1) return true
    if (target === 2) return orgValid
    if (target === 3) return orgValid && facilityValid
    if (target === 4) return orgValid && facilityValid && !!result
    return false
  }
  function tryGoTo(target: number) {
    if (target === step) return
    if (target < step) {
      setStep(target)
      return
    }
    if (target > 1 && !orgValid) {
      setStep(1)
      return
    }
    if (target > 2 && !facilityValid) {
      setStep3Tried(true)
      setStep(2)
      return
    }
    if (target === 4 && !result) {
      setStep(3)
      return
    }
    setStep(target)
  }

  return (
    <main className={theme === 'dark' ? 'wizard-app dark' : 'wizard-app'}>
      <header className="wizard-header">
        <div className="wizard-header-inner">
          <button className="wizard-brand" onClick={() => setStep(1)} title="Calculator home" aria-label="Back to calculator home">
            <img className="brand-logo" src={theme === 'dark' ? '/brand/typemark-white.svg' : '/brand/typemark-black.svg'} alt="Sustally" />
            <span className="brand-divider" />
            <span className="brand-label">
              <span className="brand-eyebrow">Scope 1 Calculator</span>
              <span className="brand-product">Cement</span>
            </span>
          </button>
          <div className="wizard-actions">
            <div className="gwp-switch">
              <span>GWP</span>
              {(['AR5', 'AR6'] as const).map((g) => (
                <button
                  key={g}
                  className={p.calculationContext.gwpSet === g ? 'active' : ''}
                  onClick={() => {
                    if (p.calculationContext.gwpSet === g) return
                    if (
                      (step >= 3 || result || live) &&
                      typeof window !== 'undefined' &&
                      !window.confirm(
                        'Changing the GWP set recalculates all CO2e values (especially fugitive emissions). Continue?',
                      )
                    ) {
                      return
                    }
                    patch((d) => (d.calculationContext.gwpSet = g))
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
            <button className="theme-switch" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </div>
      </header>

      <WizardProgressNav
        steps={STEPS}
        step={step}
        canReach={canReach}
        onGo={tryGoTo}
        gate={{
          orgValid,
          facilityValid,
          hasResult: !!result,
          facilityLockHint: 'Add a facility name on Facility & methods first.',
        }}
      />

      <section className="wizard-main">
        {step === 1 && (
          <section className="step-page active">
            <h1 className="step-title">
              What <em>sector</em> are you in?
            </h1>
            <p className="step-sub">
              Cement is the first active methodology pack (CSI Cement CO2 Protocol). Gross Scope 1 covers all four canonical source types — <b>process emissions</b> (clinker calcination), <b>stationary combustion</b>, <b>mobile combustion</b>, and <b>fugitive emissions</b> — as full CO2e. The engine is sector-extensible.
            </p>
            {hasDraft && (
              <div className="callout callout-success">
                <div>
                  <b>Draft restored.</b>{' '}
                  <span>Your previous entry was autosaved in this browser and reloaded.</span>
                </div>
                <button type="button" className="btn ghost" onClick={startFresh}>
                  Start fresh
                </button>
              </div>
            )}
            <div className="callout callout-info">
              <div>
                <b>First time here?</b>{' '}
                <span>Skip data entry and walk through the calculator with a sample cement plant.</span>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) importJson(f)
                    e.currentTarget.value = ''
                  }}
                />
                <button className="btn ghost" onClick={() => fileRef.current?.click()}>
                  Load JSON
                </button>
                <button className="add-entry-btn" onClick={loadSample} disabled={busy}>
                  {busy ? 'Loading…' : 'Try with sample data →'}
                </button>
              </div>
            </div>
            {importError && (
              <p className="field-error" style={{ marginTop: -6, marginBottom: 12 }}>{importError}</p>
            )}
            <div className="sector-grid">
              <button className="sector-card selected">
                <span className="icon"><Factory size={22} strokeWidth={1.75} /></span>
                <strong>Cement</strong>
                <small>Integrated, clinker, grinding units</small>
                <span className="tags">CSI Protocol · active</span>
              </button>
              <button className="sector-card" onClick={() => onSwitchSector?.('oil_gas')}>
                <span className="icon"><Fuel size={22} strokeWidth={1.75} /></span>
                <strong>Oil &amp; Gas</strong>
                <small>Upstream · midstream · downstream</small>
                <span className="tags">IPIECA / API · active</span>
              </button>
              <button className="sector-card" onClick={() => onSwitchSector?.('pulp_paper')}>
                <span className="icon"><Hexagon size={22} strokeWidth={1.75} /></span>
                <strong>Pulp &amp; Paper</strong>
                <small>Kraft · recycled · paper · integrated</small>
                <span className="tags">ICFPA / NCASI · active</span>
              </button>
              <button className="sector-card" onClick={() => onSwitchSector?.('iron_steel')}>
                <span className="icon"><Hexagon size={22} strokeWidth={1.75} /></span>
                <strong>Iron &amp; Steel</strong>
                <small>BF-BOF · EAF · DRI-EAF</small>
                <span className="tags">worldsteel / ISO 14404 · active</span>
              </button>
              <button className="sector-card" onClick={() => onSwitchSector?.('power')}>
                <span className="icon"><Hexagon size={22} strokeWidth={1.75} /></span>
                <strong>Power</strong>
                <small>Coal · gas · oil · biomass · CHP</small>
                <span className="tags">GHG Protocol / IPCC / EU ETS / CEA · active</span>
              </button>
              {['Chemicals', 'Textile', 'Pharma', 'General Mfg'].map((x) => (
                <button className="sector-card muted" key={x} disabled>
                  <span className="icon"><Hexagon size={22} strokeWidth={1.75} /></span>
                  <strong>{x}</strong>
                  <small>Future sector pack</small>
                  <span className="tags">Planned</span>
                </button>
              ))}
            </div>
            <div className="step-footer">
              <div />
              <button className="btn primary" onClick={() => setStep(2)}>
                Continue
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="step-page active">
            <h1 className="step-title">
              Facility, period &amp; <em>methods</em>
            </h1>
            <p className="step-sub">
              Pick the methodology tier. If the data a tier needs is missing, the engine automatically falls back to
              the next-best method and records a warning - it never silently fails.
            </p>
            <div className="form-card">
              <h2>Facility &amp; reporting period</h2>
              <div className="field-row">
                <AccessibleTextField
                  label="Facility name"
                  required
                  value={p.facility.name}
                  placeholder="Plant 1 - Maharashtra"
                  error={step3Tried && !facilityValid ? 'Facility name is required.' : undefined}
                  onChange={(v) => patch((d) => (d.facility.name = v))}
                />
                <div>
                  <AccessibleSelect
                    label="Facility type"
                    value={p.facility.facilityType}
                    onChange={(next) =>
                      patch((d) => {
                        const ft = next as InputPayload['facility']['facilityType']
                        d.facility.facilityType = ft
                        const reasons = { ...(d.sourceApplicability.exclusionReasons ?? {}) }
                        const kilnSources: Array<keyof typeof d.sourceApplicability> = [
                          'clinkerCalcination',
                          'bypassDust',
                          'ckd',
                          'rawMealToc',
                        ]
                        // Clear any prior facility-type-driven reasons before re-applying.
                        for (const key of Object.keys(reasons)) {
                          if (
                            reasons[key] === 'Grinding unit has no kiln' ||
                            reasons[key] === 'Clinker unit does not produce cement'
                          ) {
                            delete reasons[key]
                          }
                        }
                        if (ft === 'GRINDING_UNIT') {
                          // No kiln on site — calcination / dust / TOC all NA. Bought
                          // clinker is the upstream Scope 3 input.
                          for (const s of kilnSources) {
                            d.sourceApplicability[s] = false as never
                            reasons[s as string] = 'Grinding unit has no kiln'
                          }
                          // Clear any phantom clinker input the user might have
                          // typed while INTEGRATED was selected.
                          d.activityData.production.clinkerProducedTonnes = null
                          d.activityData.clinkerChemistry = {
                            caoPercent: null, caoNonCarbonatePercent: null,
                            mgoPercent: null, mgoNonCarbonatePercent: null,
                          }
                        } else if (ft === 'CLINKER_UNIT') {
                          // Kiln-only — keep kiln sources enabled, but no cement
                          // or cementitious output (they sell clinker).
                          for (const s of kilnSources) {
                            d.sourceApplicability[s] = true as never
                          }
                          d.activityData.production.cementProducedTonnes = null
                          d.activityData.production.cementitiousProductTonnes = null
                          reasons['cementProducedTonnes' as string] = 'Clinker unit does not produce cement'
                          reasons['cementitiousProductTonnes' as string] = 'Clinker unit does not produce cement'
                        } else {
                          // INTEGRATED_CEMENT — everything on.
                          for (const s of kilnSources) {
                            d.sourceApplicability[s] = true as never
                          }
                        }
                        d.sourceApplicability.exclusionReasons = reasons
                      })
                    }
                    options={[
                      { value: 'INTEGRATED_CEMENT', label: 'Integrated cement plant (kiln + mill)' },
                      { value: 'CLINKER_UNIT', label: 'Clinker unit (kiln only — sells clinker)' },
                      { value: 'GRINDING_UNIT', label: 'Grinding unit (mill only — buys clinker)' },
                    ]}
                  />
                  <small className="form-sub" style={{ marginTop: 4 }}>
                    {p.facility.facilityType === 'GRINDING_UNIT'
                      ? 'No kiln — clinker calcination CO₂ = 0. Bought clinker emissions are Scope 3 (upstream).'
                      : p.facility.facilityType === 'CLINKER_UNIT'
                        ? 'Kiln only — enter clinker produced. Sold clinker is Scope 1 here; the buyer reports it as Scope 3.'
                        : 'Integrated — calcines clinker AND grinds cement. Enter all three production volumes.'}
                  </small>
                </div>
                <label className="field">
                  Facility state / region
                  <input
                    value={p.facility.state ?? ''}
                    placeholder="e.g. Rajasthan"
                    onChange={(e) => patch((d) => (d.facility.state = e.target.value))}
                  />
                </label>
                <NumField
                  label="Reporting year"
                  value={p.calculationContext.reportingPeriod.year}
                  step="1"
                  onChange={(v) =>
                    patch((d) => {
                      const y = v ?? 2026
                      d.calculationContext.reportingPeriod = {
                        year: y,
                        startDate: `${y}-01-01`,
                        endDate: `${y}-12-31`,
                      }
                    })
                  }
                />
              </div>
            </div>
            <CementMethodologyGuide
              methodSelections={ms}
              onPatchMethods={(mut) => patch((d) => mut(d.methodSelections))}
            />
            {p.facility.facilityType === 'GRINDING_UNIT' ? (
              <div className="callout callout-info">
                <div>
                  <b>Grinding unit</b>{' '}
                  <span>
                    Kiln-linked process sources (clinker calcination, CKD, bypass dust, raw meal TOC) are locked off —
                    this site has no kiln. Stationary fuels and mobile still apply.
                  </span>
                </div>
              </div>
            ) : null}
            <SourceApplicabilityPanel
              sources={CEMENT_INVENTORY_SOURCES}
              flags={applicabilityFlags(p.sourceApplicability)}
              reasons={p.sourceApplicability.exclusionReasons}
              lockedExcluded={
                p.facility.facilityType === 'GRINDING_UNIT' ? [...CEMENT_GRINDING_LOCKED] : []
              }
              fieldErrors={
                step3Tried && !sourcesValid
                  ? Object.fromEntries(
                      CEMENT_INVENTORY_SOURCES.filter((s) => p.sourceApplicability[s.key as keyof typeof p.sourceApplicability] === false)
                        .filter((s) => !(p.sourceApplicability.exclusionReasons?.[s.key] ?? '').trim())
                        .map((s) => [s.key, 'Exclusion reason is required for audit.']),
                    )
                  : undefined
              }
              onChange={(key, included, reason) =>
                patch((d) => {
                  if (
                    d.facility.facilityType === 'GRINDING_UNIT' &&
                    (CEMENT_GRINDING_LOCKED as readonly string[]).includes(key) &&
                    included
                  ) {
                    return
                  }
                  d.sourceApplicability = updateSourceApplicability(d.sourceApplicability, key, included, reason)
                })
              }
            />
            <div className="step-footer">
              <button className="btn ghost" onClick={() => setStep(1)}>
                Back
              </button>
              <button
                className="btn primary"
                onClick={() => {
                  setStep3Tried(true)
                  if (facilityValid && sourcesValid) setStep(3)
                }}
              >
                Continue to activity data
              </button>
            </div>
            {step3Tried && (!facilityValid || !sourcesValid) && (
              <p className="field-error" style={{ marginTop: 6 }}>
                Please complete facility details and exclusion reasons for any sources marked out of scope.
              </p>
            )}
          </section>
        )}

        {step === 3 && (
          <ActivityDataShell
            categories={CATEGORIES.map(
              ({ key, label, icon }) =>
                ({
                  key,
                  label,
                  icon,
                  hint: CEMENT_ACTIVITY_HINTS[key],
                  count:
                    key === 'process'
                      ? ad.production.clinkerProducedTonnes !== null
                        ? 1
                        : 0
                      : key === 'stationary'
                        ? ad.kilnFuels.length + ad.nonKilnFuels.length
                        : key === 'mobile'
                          ? ad.mobile.length
                          : ad.fugitive.length,
                }) satisfies ActivityCategoryNav,
            )}
            activeKey={cat}
            onCategoryChange={(k) => setCat(k as Cat)}
            liveTotals={<CementLiveTotals live={live} />}
            methodology={{
              profileTitle: profileTitle(CEMENT_PROFILES, detectCementProfile(ms)),
              summaryLines: cementMethodSummary(ms).slice(0, 4),
              onEditMethods: () => setStep(2),
            }}
            tools={
              <ActivityDataTools
                sector="cement"
                onImportJson={importActivityJson}
                onImportExcel={importActivityExcel}
                onFillSampleRow={() => fillSampleRowForCategory(cat)}
              />
            }
            onFieldNavigate={navigateToField}
            validation={
              live
                ? { errors: live.errors, warnings: live.warnings }
                : undefined
            }
            advanced={
              <FactorOverridePanel
                factors={factors?.constants ?? []}
                overrides={p.factorOverrides}
                onChange={(o) => patch((d) => (d.factorOverrides = o))}
                standardsNote="GHG Protocol, ISO 14064-1, IPCC 2006, and CSI Cement CO2 Protocol v2."
              />
            }
            footer={
              <div className="step-footer">
                <button type="button" className="btn ghost" onClick={() => setStep(2)}>
                  Back
                </button>
                <button type="button" className="btn primary" disabled={busy} onClick={() => runCalculate(false)}>
                  {busy ? 'Calculating…' : 'Calculate Scope 1'}
                </button>
              </div>
            }
          >
              {cat === 'process' && (
                <>
                  <div className="form-card">
                    <h2>Production</h2>
                    <p className="form-sub">
                      {p.facility.facilityType === 'GRINDING_UNIT' ? (
                        <>Grinding unit — no kiln, so clinker calcination CO₂ is 0. Enter <b>cement</b> and <b>cementitious</b> for intensity metrics. Bought clinker is Scope 3 (upstream), not in gross Scope 1.</>
                      ) : p.facility.facilityType === 'CLINKER_UNIT' ? (
                        <>Clinker unit — kiln only, sells clinker. Enter <b>clinker produced</b>; cement / cementitious don&apos;t apply.</>
                      ) : (
                        <>Integrated cement plant — kiln + mill. Reporting-period volumes drive gross Scope 1 (clinker calcination) and intensity (kgCO₂ / t clinker, t cementitious).</>
                      )}
                    </p>
                    <div className="field-row">
                      {p.facility.facilityType !== 'GRINDING_UNIT' && (
                        <NumField label="Clinker produced" unit="t" value={ad.production.clinkerProducedTonnes} onChange={(v) => patch((d) => (d.activityData.production.clinkerProducedTonnes = v))} />
                      )}
                      {p.facility.facilityType !== 'CLINKER_UNIT' && (
                        <NumField label="Cement produced" unit="t" value={ad.production.cementProducedTonnes} onChange={(v) => patch((d) => (d.activityData.production.cementProducedTonnes = v))} />
                      )}
                      {p.facility.facilityType !== 'CLINKER_UNIT' && (
                        <NumField label="Cementitious product" unit="t" value={ad.production.cementitiousProductTonnes} onChange={(v) => patch((d) => (d.activityData.production.cementitiousProductTonnes = v))} />
                      )}
                    </div>
                  </div>

                  {ms.clinkerEmissionFactorMethod === 'PLANT_SPECIFIC_CAO_MGO' && (
                    <div className="form-card">
                      <h2>Clinker chemistry (plant-specific EF)</h2>
                      <p className="form-sub">
                        Lab-measured CaO and MgO content of your clinker. Used when the clinker EF method is
                        <b> plant-specific CaO/MgO</b> to derive a site EF instead of the CSI default 0.525 tCO2/t.
                      </p>
                      <div className="field-row">
                        <NumField label="CaO %" value={ad.clinkerChemistry.caoPercent} onChange={(v) => patch((d) => (d.activityData.clinkerChemistry.caoPercent = v))} />
                        <NumField label="Non-carbonate CaO %" value={ad.clinkerChemistry.caoNonCarbonatePercent} onChange={(v) => patch((d) => (d.activityData.clinkerChemistry.caoNonCarbonatePercent = v))} />
                        <NumField label="MgO %" value={ad.clinkerChemistry.mgoPercent} onChange={(v) => patch((d) => (d.activityData.clinkerChemistry.mgoPercent = v))} />
                        <NumField label="Non-carbonate MgO %" value={ad.clinkerChemistry.mgoNonCarbonatePercent} onChange={(v) => patch((d) => (d.activityData.clinkerChemistry.mgoNonCarbonatePercent = v))} />
                      </div>
                    </div>
                  )}

                  {ms.dustMethod === 'ACTUAL_DUST_DATA' && (
                    <div className="form-card">
                      <h2>Dust (CKD &amp; bypass)</h2>
                      <p className="form-sub">
                        Cement kiln dust and bypass dust leaving the kiln and their calcination rates. Calcined
                        dust released to atmosphere is gross Scope 1; recycled dust is not double-counted.
                      </p>
                      <div className="field-row">
                        <NumField label="CKD leaving kiln" unit="t" value={ad.dust.ckdLeavingKilnTonnes} onChange={(v) => patch((d) => (d.activityData.dust.ckdLeavingKilnTonnes = v))} />
                        <NumField label="CKD calcination rate (0–1)" step="0.01" value={ad.dust.ckdCalcinationRate} onChange={(v) => patch((d) => (d.activityData.dust.ckdCalcinationRate = v))} hint="Default 1" />
                        <NumField label="Bypass dust leaving kiln" unit="t" value={ad.dust.bypassDustLeavingKilnTonnes} onChange={(v) => patch((d) => (d.activityData.dust.bypassDustLeavingKilnTonnes = v))} />
                        <NumField label="Bypass calcination rate (0–1)" step="0.01" value={ad.dust.bypassDustCalcinationRate} onChange={(v) => patch((d) => (d.activityData.dust.bypassDustCalcinationRate = v))} hint="Default 1" />
                      </div>
                    </div>
                  )}

                  {ms.tocMethod === 'PLANT_SPECIFIC_TOC' && (
                    <div className="form-card">
                      <h2>Raw meal TOC (plant-specific)</h2>
                      <p className="form-sub">
                        The kiln burns the organic carbon in raw meal to CO2 (small but reportable under CSI v3).
                        Defaults are 1.55 (raw-meal/clinker ratio) and 0.002 (TOC fraction) — override only with lab data.
                      </p>
                      <div className="field-row">
                        <NumField label="Raw meal / clinker ratio" step="0.01" value={ad.rawMeal.rawMealToClinkerRatio} onChange={(v) => patch((d) => (d.activityData.rawMeal.rawMealToClinkerRatio = v))} hint="Default 1.55" />
                        <NumField label="TOC fraction" step="0.0001" value={ad.rawMeal.tocFraction} onChange={(v) => patch((d) => (d.activityData.rawMeal.tocFraction = v))} hint="Default 0.002" />
                      </div>
                    </div>
                  )}

                  {ms.processEmissionMethod === 'US_EPA_CEMENT_BASED_FALLBACK' && (
                    <div className="form-card">
                      <h2>US EPA cement-based fallback inputs</h2>
                      <p className="form-sub">
                        Conservative fallback used when CSI / IPCC inputs aren&apos;t available: process CO2 =
                        cement produced × clinker-to-cement ratio × clinker EF. Use only when better data is missing.
                      </p>
                      <div className="field-row">
                        <NumField label="Cement produced" unit="t" value={ad.usEpaFallback.cementProducedTonnes} onChange={(v) => patch((d) => (d.activityData.usEpaFallback.cementProducedTonnes = v))} />
                        <NumField label="Clinker / cement ratio" step="0.01" value={ad.usEpaFallback.clinkerToCementRatio} onChange={(v) => patch((d) => (d.activityData.usEpaFallback.clinkerToCementRatio = v))} />
                        <NumField label="Clinker EF override" unit="tCO2/t" step="0.001" value={ad.usEpaFallback.clinkerEfTco2PerTonne} onChange={(v) => patch((d) => (d.activityData.usEpaFallback.clinkerEfTco2PerTonne = v))} hint="Default CSI 0.525" />
                      </div>
                    </div>
                  )}
                </>
              )}

              {cat === 'stationary' && (
                <>
                  <FuelTable
                    title="Kiln fuels"
                    entries={ad.kilnFuels}
                    trace={trace}
                    method={ms.fuelCombustionMethod}
                    onChange={(rows) => patch((d) => (d.activityData.kilnFuels = rows))}
                  />
                  <FuelTable
                    title="Non-kiln fossil fuels"
                    entries={ad.nonKilnFuels}
                    trace={trace}
                    method={ms.fuelCombustionMethod}
                    onChange={(rows) => patch((d) => (d.activityData.nonKilnFuels = rows))}
                  />
                </>
              )}

              {cat === 'mobile' && (
                <MobileTable
                  entries={ad.mobile}
                  trace={trace}
                  method={ms.mobileCombustionMethod}
                  onChange={(rows) => patch((d) => (d.activityData.mobile = rows))}
                />
              )}

              {cat === 'fugitive' && (
                <FugitiveTable
                  entries={ad.fugitive}
                  trace={trace}
                  gwpByGas={gwpByGas}
                  gwpSet={p.calculationContext.gwpSet}
                  onChange={(rows) => patch((d) => (d.activityData.fugitive = rows))}
                />
              )}

              <div className="form-card">
                <h2>Reconciliation against a disclosed total</h2>
                <p className="form-sub">
                  Optional. If you have a published gross Scope 1 CO2 figure (CSI gross, tCO2), enter it here. We flag a
                  variance above 5%.
                </p>
                <NumField
                  label="Disclosed gross Scope 1"
                  unit="tCO2"
                  fieldPath="activityData.disclosedGrossScope1CO2Tonnes"
                  value={ad.disclosedGrossScope1CO2Tonnes ?? null}
                  onChange={(v) => patch((d) => (d.activityData.disclosedGrossScope1CO2Tonnes = v))}
                  hint="from public disclosure or group inventory"
                />
              </div>
          </ActivityDataShell>
        )}

        {step === 4 && result && (
          <ResultsPage
            result={result}
            payload={p}
            busy={busy}
            onBack={() => setStep(3)}
            onReset={() => {
              setResult(null)
              setP(emptyPayload())
              setStep(1)
            }}
            onSave={() => runCalculate(true)}
            onLock={lockInventory}
            locked={submitted}
            onDownload={download}
            versions={listInventoryVersions('cement')}
            onRestore={(snap) => {
              if (snap.payload) {
                setP(snap.payload as InputPayload)
                saveCementDraft(snap.payload as InputPayload)
                setResult(null)
                setLive(null)
                setStep(3)
              }
            }}
            onSignoffPatch={(fields) =>
              patch((d) => {
                if (fields.contactName !== undefined) {
                  d.organization.contactName = fields.contactName
                  d.auditMetadata = { ...d.auditMetadata, preparedBy: fields.contactName }
                }
                if (fields.contactEmail !== undefined) d.organization.contactEmail = fields.contactEmail
                if (fields.contactPhone !== undefined) d.organization.contactPhone = fields.contactPhone
                if (fields.contactRole !== undefined) d.organization.contactRole = fields.contactRole
                if (fields.notes !== undefined) {
                  d.auditMetadata = { ...d.auditMetadata, notes: fields.notes }
                }
              })
            }
          />
        )}
      </section>
    </main>
  )
}

/* ---------------------------- Live totals strip --------------------------- */

function CementLiveTotals({ live }: { live: CalculationResult | null }) {
  if (!live) return null
  const c = live.scope1.components
  const processTotal =
    c.clinkerCalcinationCO2Tonnes +
    c.bypassDustCO2Tonnes +
    c.ckdCO2Tonnes +
    c.rawMealTocCO2Tonnes
  const combustionTotal =
    c.conventionalKilnFuelCO2Tonnes +
    c.alternativeFossilKilnFuelCO2Tonnes +
    c.nonKilnFossilCO2Tonnes +
    c.mobileCombustionCO2Tonnes
  return (
    <LiveTotalsStrip
      headlineItems={[
        { label: 'Gross Scope 1', value: live.scope1.grossScope1CO2Tonnes, unit: 'tCO2e' },
        { label: 'Process emissions', value: processTotal, unit: 'tCO2' },
        { label: 'Combustion', value: combustionTotal, unit: 'tCO2' },
        { label: 'Fugitive', value: c.fugitiveCO2eTonnes, unit: 'tCO2e' },
      ]}
      detailItems={[
        { label: 'Clinker calcination', value: c.clinkerCalcinationCO2Tonnes, unit: 'tCO2' },
        { label: 'Bypass dust', value: c.bypassDustCO2Tonnes, unit: 'tCO2' },
        { label: 'CKD', value: c.ckdCO2Tonnes, unit: 'tCO2' },
        { label: 'Raw meal TOC', value: c.rawMealTocCO2Tonnes, unit: 'tCO2' },
        { label: 'Conventional kiln fuel', value: c.conventionalKilnFuelCO2Tonnes, unit: 'tCO2' },
        { label: 'Alt. fossil kiln fuel', value: c.alternativeFossilKilnFuelCO2Tonnes, unit: 'tCO2' },
        { label: 'Non-kiln fossil', value: c.nonKilnFossilCO2Tonnes, unit: 'tCO2' },
        { label: 'Mobile combustion', value: c.mobileCombustionCO2Tonnes, unit: 'tCO2' },
        { label: 'Biomass memo (excluded)', value: live.memoItems.biomassCO2Tonnes, unit: 'tCO2' },
        { label: 'CH4 / N2O (separate)', value: live.nonCsiCombustionGhg.ch4N2oCO2eTonnes, unit: 'tCO2e' },
      ]}
    />
  )
}

/* ----------------------------- Row preview & badge ---------------------------- */

function RowPreview({ co2 }: { co2: number | null }) {
  return (
    <span className="row-co2-chip" title="Live row CO2 (recalculated as you type)">
      {co2 === null ? '—' : fmt4(co2)} <small>tCO2e live</small>
    </span>
  )
}

/* ---------------------------------- Fuel ---------------------------------- */

function FuelTable({
  title,
  entries,
  trace,
  method,
  onChange,
}: {
  title: string
  entries: FuelEntry[]
  trace: TraceEntry[] | undefined
  method: FuelCombustionMethod
  onChange: (rows: FuelEntry[]) => void
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  function toggle(id: string) {
    setExpanded((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }
  function add() {
    onChange([
      ...entries,
      {
        id: crypto.randomUUID(),
        label: title === 'Kiln fuels' ? 'Kiln fuel' : 'Non-kiln fuel',
        fuelCode: 'petcoke',
        category: 'CONVENTIONAL_FOSSIL',
        quantity: null,
        quantityUnit: 'tonne',
      },
    ])
  }
  function upd(id: string, mut: (f: FuelEntry) => void) {
    onChange(
      entries.map((e) => {
        if (e.id !== id) return e
        const c = { ...e }
        mut(c)
        return c
      }),
    )
  }
  return (
    <div className="form-card">
      <h2>{title}</h2>
      <p className="form-sub">
        Fossil CO2 + CH4 + N2O are gross Scope 1; biomass CO2 is a separate memo item (excluded from gross).
        Use <b>Advanced overrides</b> only when plant-specific LHV / emission factors differ from the library default.
      </p>
      {entries.length === 0 ? (
        <ActivityEmptyState
          title="No fuel rows yet"
          hint="Add kiln or non-kiln fossil fuel combustion sources."
          onAdd={add}
          addLabel="Add fuel"
        />
      ) : null}
      {entries.map((e, i) => {
        const rowCO2 = fuelRowCO2(trace, e.label)
        const hasFactorOverride =
          e.lhvGjPerUnit != null ||
          e.co2EfKgPerGj != null ||
          e.ch4EfKgPerGj != null ||
          e.n2oEfKgPerGj != null ||
          e.biomassFraction != null
        const isOpen = expanded.has(e.id) || hasFactorOverride
        return (
          <div key={e.id} className="entry-card">
            <div className="entry-card-head">
              <div className="entry-card-head-left">
                <span className="entry-num">#{i + 1}</span>
                <span className="entry-title">{e.label || '(unnamed fuel)'}</span>
                {fuelBadge(e.category)}
                <RowPreview co2={rowCO2} />
              </div>
              <button className="entry-delete" onClick={() => onChange(entries.filter((x) => x.id !== e.id))}>
                <Trash2 size={13} /> Remove
              </button>
            </div>

            <div className="entry-card-section">
              <div className="entry-card-section-label">Basics</div>
              <div className="field-row">
                <label className="field">
                  Label
                  <input value={e.label} onChange={(ev) => upd(e.id, (f) => (f.label = ev.target.value))} />
                </label>
                <EntryLabeledSelect
                  label="Fuel"
                  value={e.fuelCode}
                  onChange={(v) => upd(e.id, (f) => (f.fuelCode = v))}
                  options={codesToOptions(FUEL_CODES, fuelLabel)}
                />
                <EntryLabeledSelect
                  label="Category"
                  value={e.category}
                  onChange={(v) => upd(e.id, (f) => (f.category = v as FuelEntry['category']))}
                  options={[
                    { value: 'CONVENTIONAL_FOSSIL', label: 'Conventional fossil' },
                    { value: 'ALTERNATIVE_FOSSIL', label: 'Alternative fossil' },
                    { value: 'MIXED', label: 'Mixed (fossil + biomass)' },
                    { value: 'BIOMASS', label: 'Biomass' },
                  ]}
                />
                <NumField label="Quantity" unit={e.quantityUnit} value={e.quantity} onChange={(v) => upd(e.id, (f) => (f.quantity = v))} />
              </div>
              {method === 'CARBON_CONTENT_BASED' && (
                <div className="field-row">
                  <NumField
                    label="Carbon content fraction"
                    step="0.0001"
                    value={e.carbonContentFraction ?? null}
                    onChange={(v) => upd(e.id, (f) => (f.carbonContentFraction = v))}
                    hint="0–1; e.g. petcoke ≈ 0.85"
                  />
                </div>
              )}
              {method === 'DIRECT_MEASUREMENT' && (
                <div className="field-row">
                  <NumField
                    label="Direct measured CO2"
                    unit="tCO2"
                    value={e.directCo2Tonnes ?? null}
                    onChange={(v) => upd(e.id, (f) => (f.directCo2Tonnes = v))}
                    hint="From CEMS / metered emissions"
                  />
                </div>
              )}
            </div>

            <details className="entry-evidence" open={!!(e.evidenceReference || e.overrideReason)}>
              <summary>Evidence &amp; notes</summary>
              <div className="field-row">
                <label className="field">
                  Evidence reference
                  <input
                    value={e.evidenceReference ?? ''}
                    placeholder="e.g. ERP fuel report 2026 · meter log · supplier invoice"
                    onChange={(ev) => upd(e.id, (f) => (f.evidenceReference = ev.target.value))}
                  />
                </label>
                <label className="field">
                  Notes / override reason
                  <input
                    value={e.overrideReason ?? ''}
                    placeholder="Required when any factor on this row is overridden"
                    onChange={(ev) => upd(e.id, (f) => (f.overrideReason = ev.target.value))}
                  />
                </label>
              </div>
            </details>

            <button className="advanced-toggle" onClick={() => toggle(e.id)}>
              {isOpen ? '▴' : '▾'} Advanced overrides {hasFactorOverride && <span className="entry-badge entry-badge-mixed" style={{ marginLeft: 6 }}>customised</span>}
            </button>

            {isOpen && (
              <div className="entry-card-section">
                <div className="entry-card-section-label">Factor overrides (blank = use library default)</div>
                {method === 'ENERGY_BASED' && (
                  <>
                    <div className="field-row">
                      <NumField label="LHV override" unit="GJ/unit" step="0.0001" value={e.lhvGjPerUnit ?? null} onChange={(v) => upd(e.id, (f) => (f.lhvGjPerUnit = v))} hint="blank = library default" />
                      <NumField label="CO2 EF override" unit="kg/GJ" step="0.01" value={e.co2EfKgPerGj ?? null} onChange={(v) => upd(e.id, (f) => (f.co2EfKgPerGj = v))} hint="blank = library default" />
                      <NumField label="Biomass fraction" step="0.01" value={e.biomassFraction ?? null} onChange={(v) => upd(e.id, (f) => (f.biomassFraction = v))} hint="0–1" />
                    </div>
                    <div className="field-row">
                      <NumField label="CH4 EF override" unit="kg/GJ" step="0.0001" value={e.ch4EfKgPerGj ?? null} onChange={(v) => upd(e.id, (f) => (f.ch4EfKgPerGj = v))} hint="blank = library default" />
                      <NumField label="N2O EF override" unit="kg/GJ" step="0.0001" value={e.n2oEfKgPerGj ?? null} onChange={(v) => upd(e.id, (f) => (f.n2oEfKgPerGj = v))} hint="blank = library default" />
                    </div>
                  </>
                )}
                {method !== 'ENERGY_BASED' && (
                  <div className="field-row">
                    <NumField label="Biomass fraction" step="0.01" value={e.biomassFraction ?? null} onChange={(v) => upd(e.id, (f) => (f.biomassFraction = v))} hint="0–1" />
                  </div>
                )}
              </div>
            )}

            <div className="entry-formula">
              {method === 'ENERGY_BASED' && (
                <>quantity × LHV ÷ 1000 × CO2 EF = tCO2 · <b>fossil → Scope 1</b> · biomass → memo (excluded) · CH4/N2O → Scope 1 via GWP</>
              )}
              {method === 'CARBON_CONTENT_BASED' && (
                <>quantity (t) × carbon content fraction × 44/12 = tCO2 · <b>fossil → Scope 1</b> · biomass → memo</>
              )}
              {method === 'DIRECT_MEASUREMENT' && (
                <>directly metered tCO2 (e.g. CEMS). <b>Note:</b> CH4/N2O addendum needs a fuel energy basis and isn&apos;t computed for direct-measurement rows.</>
              )}
            </div>
          </div>
        )
      })}
      <button className="add-entry-btn" onClick={add}>
        <Plus size={15} /> Add fuel
      </button>
    </div>
  )
}

/* --------------------------------- Mobile -------------------------------- */

function MobileTable({
  entries,
  trace,
  method,
  onChange,
}: {
  entries: MobileEntry[]
  trace: TraceEntry[] | undefined
  method: MobileCombustionMethod
  onChange: (rows: MobileEntry[]) => void
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  function toggle(id: string) {
    setExpanded((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }
  function add() {
    onChange([
      ...entries,
      {
        id: crypto.randomUUID(),
        label: 'Mobile equipment',
        ownership: 'OWNED_CONTROLLED',
        fuelCode: 'diesel',
        quantity: null,
        quantityUnit: 'L',
      },
    ])
  }
  function upd(id: string, mut: (m: MobileEntry) => void) {
    onChange(
      entries.map((e) => {
        if (e.id !== id) return e
        const c = { ...e }
        mut(c)
        return c
      }),
    )
  }
  return (
    <div className="form-card">
      <h2>Mobile combustion (owned / controlled = Scope 1)</h2>
      <p className="form-sub">
        Plant-owned or operationally-controlled vehicles and equipment are gross Scope 1.
        Third-party transport (logistics contractors, employee commute) is <b>Scope 3</b> and excluded here.
        Use <b>Advanced overrides</b> only when fleet-specific LHV / EFs differ from the library default.
      </p>
      {entries.length === 0 ? (
        <ActivityEmptyState
          title="No mobile equipment yet"
          hint="Add owned or operationally controlled mobile sources."
          onAdd={add}
          addLabel="Add mobile equipment"
        />
      ) : null}
      {entries.map((e, i) => {
        const rowCO2 = mobileRowCO2(trace, e.label)
        const isNonCanonical = e.fuelCode === 'diesel' && e.quantityUnit !== 'L'
        const hasFactorOverride =
          e.lhvGjPerUnit != null ||
          e.co2EfKgPerGj != null ||
          e.ch4EfKgPerGj != null ||
          e.n2oEfKgPerGj != null
        const isOpen = expanded.has(e.id) || hasFactorOverride || isNonCanonical
        return (
          <div key={e.id} className="entry-card">
            <div className="entry-card-head">
              <div className="entry-card-head-left">
                <span className="entry-num">#{i + 1}</span>
                <span className="entry-title">{e.label || '(unnamed mobile)'}</span>
                {mobileBadge(e.ownership)}
                <RowPreview co2={rowCO2} />
              </div>
              <button className="entry-delete" onClick={() => onChange(entries.filter((x) => x.id !== e.id))}>
                <Trash2 size={13} /> Remove
              </button>
            </div>

            <div className="entry-card-section">
              <div className="entry-card-section-label">Basics</div>
              <div className="field-row">
                <label className="field">
                  Label
                  <input value={e.label} onChange={(ev) => upd(e.id, (m) => (m.label = ev.target.value))} />
                </label>
                <EntryLabeledSelect
                  label="Ownership"
                  value={e.ownership}
                  onChange={(v) => upd(e.id, (m) => (m.ownership = v as MobileEntry['ownership']))}
                  options={[
                    { value: 'OWNED_CONTROLLED', label: 'Owned / controlled (Scope 1)' },
                    { value: 'THIRD_PARTY', label: 'Third-party (excluded)' },
                  ]}
                />
                <EntryLabeledSelect
                  label="Fuel"
                  value={e.fuelCode}
                  onChange={(v) => upd(e.id, (m) => (m.fuelCode = v))}
                  options={codesToOptions(['diesel', 'natural_gas', 'heavy_fuel_oil'], fuelLabel)}
                />
              </div>
              <div className="field-row">
                <EntryLabeledSelect
                  label="Unit"
                  value={e.quantityUnit}
                  onChange={(v) => upd(e.id, (m) => (m.quantityUnit = v))}
                  options={MOBILE_UNITS.map((u) => ({ value: u, label: u }))}
                />
                {method === 'FUEL_BASED' && (
                  <NumField
                    label="Fuel quantity"
                    unit={e.quantityUnit}
                    value={e.quantity}
                    onChange={(v) => upd(e.id, (m) => (m.quantity = v))}
                  />
                )}
                {method === 'EQUIPMENT_HOURS_BASED' && (
                  <>
                    <NumField
                      label="Operating hours"
                      unit="hrs"
                      value={e.operatingHours ?? null}
                      onChange={(v) => upd(e.id, (m) => (m.operatingHours = v))}
                    />
                    <NumField
                      label="Consumption rate"
                      unit={`${e.quantityUnit}/hr`}
                      step="0.0001"
                      value={e.consumptionRatePerHour ?? null}
                      onChange={(v) => upd(e.id, (m) => (m.consumptionRatePerHour = v))}
                    />
                  </>
                )}
                {method === 'DISTANCE_BASED' && (
                  <>
                    <NumField
                      label="Distance"
                      unit="km"
                      value={e.distanceKm ?? null}
                      onChange={(v) => upd(e.id, (m) => (m.distanceKm = v))}
                    />
                    <NumField
                      label="Fuel per km"
                      unit={`${e.quantityUnit}/km`}
                      step="0.0001"
                      value={e.fuelPerKm ?? null}
                      onChange={(v) => upd(e.id, (m) => (m.fuelPerKm = v))}
                    />
                  </>
                )}
              </div>
              {isNonCanonical && (
                <div className="inline-warn">
                  Library LHV for diesel is per L. You picked <b>{e.quantityUnit}</b> — supply an LHV in GJ/
                  {e.quantityUnit} in <b>Advanced overrides</b> below.
                </div>
              )}
            </div>

            <details className="entry-evidence" open={!!(e.evidenceReference || e.overrideReason)}>
              <summary>Evidence &amp; notes</summary>
              <div className="field-row">
                <label className="field">
                  Evidence reference
                  <input
                    value={e.evidenceReference ?? ''}
                    placeholder="e.g. fleet fuel-card statement · pump dispenser log"
                    onChange={(ev) => upd(e.id, (m) => (m.evidenceReference = ev.target.value))}
                  />
                </label>
                <label className="field">
                  Notes / override reason
                  <input
                    value={e.overrideReason ?? ''}
                    placeholder="Required when LHV/EF differs from library default"
                    onChange={(ev) => upd(e.id, (m) => (m.overrideReason = ev.target.value))}
                  />
                </label>
              </div>
            </details>

            <button className="advanced-toggle" onClick={() => toggle(e.id)}>
              {isOpen ? '▴' : '▾'} Advanced overrides {hasFactorOverride && <span className="entry-badge entry-badge-mixed" style={{ marginLeft: 6 }}>customised</span>}
            </button>

            {isOpen && (
              <div className="entry-card-section">
                <div className="entry-card-section-label">Factor overrides (blank = library default)</div>
                <div className="field-row">
                  <NumField label="LHV override" unit={`GJ/${e.quantityUnit}`} step="0.0001" value={e.lhvGjPerUnit ?? null} onChange={(v) => upd(e.id, (m) => (m.lhvGjPerUnit = v))} hint="blank = library default" />
                  <NumField label="CO2 EF override" unit="kg/GJ" step="0.01" value={e.co2EfKgPerGj ?? null} onChange={(v) => upd(e.id, (m) => (m.co2EfKgPerGj = v))} hint="blank = library default" />
                </div>
                <div className="field-row">
                  <NumField label="CH4 EF override" unit="kg/GJ" step="0.0001" value={e.ch4EfKgPerGj ?? null} onChange={(v) => upd(e.id, (m) => (m.ch4EfKgPerGj = v))} hint="blank = library default" />
                  <NumField label="N2O EF override" unit="kg/GJ" step="0.0001" value={e.n2oEfKgPerGj ?? null} onChange={(v) => upd(e.id, (m) => (m.n2oEfKgPerGj = v))} hint="blank = library default" />
                </div>
              </div>
            )}

            <div className="entry-formula">
              {method === 'FUEL_BASED' && (
                <>fuel qty ({e.quantityUnit}) × LHV (GJ/{e.quantityUnit}) ÷ 1000 × CO2 EF (kg/GJ) = tCO2 · <b>owned → Scope 1</b> · third-party → Scope 3 (excluded)</>
              )}
              {method === 'EQUIPMENT_HOURS_BASED' && (
                <>hrs × consumption ({e.quantityUnit}/hr) → fuel qty, then × LHV ÷ 1000 × CO2 EF = tCO2 · <b>owned → Scope 1</b> · third-party → Scope 3 (excluded)</>
              )}
              {method === 'DISTANCE_BASED' && (
                <>km × fuel-per-km ({e.quantityUnit}/km) → fuel qty, then × LHV ÷ 1000 × CO2 EF = tCO2 · <b>owned → Scope 1</b> · third-party → Scope 3 (excluded)</>
              )}
            </div>
          </div>
        )
      })}
      <button className="add-entry-btn" onClick={add}>
        <Plus size={15} /> Add mobile equipment
      </button>
    </div>
  )
}

/* -------------------------------- Fugitive ------------------------------- */

const LABEL_HINTS: Record<string, string[]> = {
  r22: ['r22', 'r-22', 'hcfc-22', 'hcfc22'],
  r32: ['r32', 'r-32', 'hfc-32', 'hfc32'],
  r134a: ['r134a', 'r-134a', 'hfc-134a', 'hfc134a'],
  r404a: ['r404a', 'r-404a'],
  r407c: ['r407c', 'r-407c'],
  r410a: ['r410a', 'r-410a'],
  r507a: ['r507a', 'r-507a'],
  r23: ['r23', 'r-23', 'hfc-23', 'hfc23'],
  sf6: ['sf6', 'sf-6', 'sulphur hexafluoride', 'sulfur hexafluoride'],
}
function inlineLabelMismatch(label: string, selected: string): string | null {
  const n = (label || '').toLowerCase()
  for (const [code, hints] of Object.entries(LABEL_HINTS)) {
    if (code === selected) continue
    if (hints.some((h) => n.includes(h))) return code
  }
  return null
}

function FugitiveTable({
  entries,
  trace,
  gwpByGas,
  gwpSet,
  onChange,
}: {
  entries: FugitiveEntry[]
  trace: TraceEntry[] | undefined
  gwpByGas: Record<string, number>
  gwpSet: 'AR5' | 'AR6'
  onChange: (rows: FugitiveEntry[]) => void
}) {
  function add() {
    onChange([
      ...entries,
      { id: crypto.randomUUID(), label: 'Refrigerant / SF6', gasCode: 'r410a', leakedKg: null },
    ])
  }
  function upd(id: string, mut: (g: FugitiveEntry) => void) {
    onChange(
      entries.map((e) => {
        if (e.id !== id) return e
        const c = { ...e }
        mut(c)
        return c
      }),
    )
  }
  return (
    <div className="form-card">
      <h2>Fugitive emissions (refrigerant leakage, SF6 switchgear)</h2>
      <p className="form-sub">Direct Scope 1 release of high-GWP gases. Reported as CO2e using GWP ({gwpSet}).</p>
      {entries.length === 0 ? (
        <ActivityEmptyState
          title="No fugitive sources yet"
          hint="Add refrigerant leakage or SF6 switchgear sources."
          onAdd={add}
          addLabel="Add fugitive source"
        />
      ) : null}
      {entries.map((e, i) => {
        const rowCO2 = fugitiveRowCO2(trace, e.label)
        const libGwp = gwpByGas[e.gasCode]
        const mismatch = inlineLabelMismatch(e.label, e.gasCode)
        return (
          <div key={e.id} className="entry-card">
            <div className="entry-card-head">
              <div className="entry-card-head-left">
                <span className="entry-num">#{i + 1}</span>
                <span className="entry-title">{e.label || '(unnamed fugitive)'}</span>
                {FUGITIVE_BADGE}
                <RowPreview co2={rowCO2} />
              </div>
              <button className="entry-delete" onClick={() => onChange(entries.filter((x) => x.id !== e.id))}>
                <Trash2 size={13} /> Remove
              </button>
            </div>

            <div className="entry-card-section">
              <div className="entry-card-section-label">Basics</div>
              <div className="field-row">
                <label className="field">
                  Label
                  <input value={e.label} onChange={(ev) => upd(e.id, (g) => (g.label = ev.target.value))} />
                </label>
                <div className="field">
                  <EntryLabeledSelect
                    label="Gas"
                    value={e.gasCode}
                    onChange={(v) => upd(e.id, (g) => (g.gasCode = v))}
                    options={codesToOptions(GAS_CODES, gasLabel)}
                  />
                  <small className="form-sub">
                    Library GWP ({gwpSet}): <b>{libGwp ? fmt(libGwp) : 'n/a'}</b>
                  </small>
                </div>
                <NumField label="Quantity leaked / top-up" unit="kg" value={e.leakedKg} onChange={(v) => upd(e.id, (g) => (g.leakedKg = v))} />
                <NumField label="GWP override" step="1" value={e.gwpOverride ?? null} onChange={(v) => upd(e.id, (g) => (g.gwpOverride = v))} hint="Blank = library GWP" />
              </div>
            </div>

            <div className="entry-card-section">
              <div className="entry-card-section-label">Audit</div>
              <div className="field-row">
                <label className="field" style={{ gridColumn: 'span 2' }}>
                  GWP override reason
                  <input
                    value={e.overrideReason ?? ''}
                    placeholder="Required when a GWP override is supplied (e.g. supplier blend GWP)"
                    onChange={(ev) => upd(e.id, (g) => (g.overrideReason = ev.target.value))}
                  />
                </label>
                <label className="field">
                  Evidence reference
                  <input
                    value={e.evidenceReference ?? ''}
                    placeholder="e.g. AMC service report / refrigerant log"
                    onChange={(ev) => upd(e.id, (g) => (g.evidenceReference = ev.target.value))}
                  />
                </label>
              </div>
            </div>

            {mismatch && (
              <div className="inline-warn">
                ⚠ Label mentions <b>{mismatch.toUpperCase()}</b> but the selected gas is{' '}
                <b>{e.gasCode.toUpperCase()}</b>. This can cause a major GWP error — please confirm.
              </div>
            )}

            <div className="entry-formula">Formula: leaked kg × GWP ÷ 1000 = tCO2e</div>
          </div>
        )
      })}
      <button className="add-entry-btn" onClick={add}>
        <Plus size={15} /> Add fugitive source
      </button>
    </div>
  )
}

/* --------------------------------- Step 5 -------------------------------- */

function ResultsPage({
  result,
  payload,
  busy,
  onBack,
  onReset,
  onSave,
  onLock,
  locked,
  onDownload,
  onSignoffPatch,
  versions,
  onRestore,
}: {
  result: CalculationResult
  payload: InputPayload
  busy: boolean
  onBack: () => void
  onReset: () => void
  onSave: () => void
  onLock?: () => void
  locked?: boolean
  onDownload: (format: 'json' | 'xlsx' | 'pdf') => void
  versions: ReturnType<typeof listInventoryVersions>
  onRestore?: (snap: ReturnType<typeof listInventoryVersions>[number]) => void
  onSignoffPatch: (fields: {
    contactName?: string
    contactEmail?: string
    contactPhone?: string
    contactRole?: string
    notes?: string
  }) => void
}) {
  const [tab, setTab] = useState<ResultsTab>('summary')
  const c = result.scope1.components
  const processTotal =
    c.clinkerCalcinationCO2Tonnes +
    c.bypassDustCO2Tonnes +
    c.ckdCO2Tonnes +
    c.rawMealTocCO2Tonnes
  const combustionTotal =
    c.conventionalKilnFuelCO2Tonnes +
    c.alternativeFossilKilnFuelCO2Tonnes +
    c.nonKilnFossilCO2Tonnes +
    c.mobileCombustionCO2Tonnes
  const driverGroups = [
    { label: 'Process emissions', value: processTotal, unit: 'tCO2' as const },
    { label: 'Combustion', value: combustionTotal, unit: 'tCO2' as const },
    { label: 'Fugitive', value: c.fugitiveCO2eTonnes, unit: 'tCO2e' as const },
  ]
  const auditCount = result.factorSnapshots.length + result.calculationTrace.length

  return (
    <section className="step-page active results-page">
      <h1 className="step-title">
        Your <em>Scope 1</em> inventory
      </h1>
      <p className="step-sub">
        {result.methodologyPack} · GWP {payload.calculationContext.gwpSet} · {payload.organization.name} ·{' '}
        {payload.facility.name}
      </p>

      <InventoryStatusBanner
        status={result.status}
        dataQuality={result.dataQuality.overall}
        errorCount={result.errors.length}
        warningCount={result.warnings.length}
      />

      <ReportSignoffPanel
        organization={payload.organization}
        auditMetadata={payload.auditMetadata}
        onPatch={onSignoffPatch}
      />

      <VersionHistoryPanel
        versions={versions}
        currentGross={result.scope1.grossScope1CO2Tonnes}
        onRestore={onRestore}
      />

      <StickyExportBar
        busy={busy}
        signoff={payload}
        onPdf={() => onDownload('pdf')}
        onExcel={() => onDownload('xlsx')}
        onJson={() => onDownload('json')}
        onSave={onSave}
        onLock={onLock}
        locked={locked}
      />

      <ResultsViewTabs tab={tab} onChange={setTab} auditCount={auditCount} />

      {tab === 'summary' && (
        <>
          <div className="summary-hero">
            <span>Gross Scope 1 direct emissions — FY {result.reportingPeriod.year}</span>
            <strong>
              {fmt(result.scope1.grossScope1CO2Tonnes)}
              <small> tCO2e</small>
            </strong>
            <p>Process + stationary + mobile + fugitive. Biomass CO2 and combustion CH4/N2O are reported separately.</p>
          </div>

          <div className="form-card">
            <h2>Emissions drivers</h2>
            <p className="form-sub">Share of gross Scope 1 by major source group.</p>
            <EmissionsDriverChart gross={result.scope1.grossScope1CO2Tonnes} groups={driverGroups} />
          </div>

          <div className="summary-cats summary-cats-compact">
            <div className="summary-card">
              <span>Intensity / t clinker</span>
              <strong>{result.intensityMetrics.grossCO2PerTonneClinker ?? 'n/a'}</strong>
              <small>kgCO2e/t</small>
            </div>
            <div className="summary-card">
              <span>Intensity / t cementitious</span>
              <strong>{result.intensityMetrics.grossCO2PerTonneCementitious ?? 'n/a'}</strong>
              <small>kgCO2e/t</small>
            </div>
          </div>

          {result.reconciliation.checked ? (
            <ReconciliationPanel note={result.reconciliation.note} lines={result.reconciliation.lines} />
          ) : null}

          <div className="form-card">
            <h2>Shown separately (not in gross Scope 1)</h2>
            <div className="result-table">
              <div className="result-row">
                <div>
                  <strong>Biomass CO2 (memo item)</strong>
                  <span>Excluded from gross Scope 1 per GHG Protocol</span>
                </div>
                <strong>{fmt(result.memoItems.biomassCO2Tonnes)} t</strong>
              </div>
              <div className="result-row">
                <div>
                  <strong>Combustion CH4/N2O</strong>
                  <span>CSI process method is CO2-only; shown separately, not merged</span>
                </div>
                <strong>{fmt(result.nonCsiCombustionGhg.ch4N2oCO2eTonnes)} tCO2e</strong>
              </div>
            </div>
          </div>

          {(result.errors.length > 0 || result.warnings.length > 0) && (
            <div className="form-card">
              <h2>
                Validation ({result.errors.length} errors · {result.warnings.length} warnings)
              </h2>
              {result.errors.map((e, i) => (
                <p key={`e${i}`} className="form-sub text-error">
                  ⛔ {e.code} — {e.message}
                </p>
              ))}
              {result.warnings.map((w, i) => (
                <p key={`w${i}`} className="form-sub text-warn">
                  ⚠ {w.code} — {w.message}
                </p>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'breakdown' && (
        <>
          <p className="form-sub">Line-item contributions that sum to gross Scope 1.</p>
          <CementBreakdownCards components={result.scope1.components} />
        </>
      )}

      {tab === 'audit' && (
        <>
          <FactorSnapshotsPanel snapshots={result.factorSnapshots} />
          <CalculationTracePanel trace={result.calculationTrace} />
        </>
      )}

      <div className="step-footer">
        <button type="button" className="btn ghost" onClick={onBack}>
          Back to inputs
        </button>
        <button type="button" className="btn primary" onClick={onReset}>
          Start over
        </button>
      </div>
    </section>
  )
}
