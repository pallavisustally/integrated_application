'use client'

/**
 * Pulp & Paper Scope 1 wizard. 5 steps (Sector → Org/boundary → Mill/methods →
 * Activity data with 11 tabs → Review). Mirrors the O&G wizard's look & feel:
 * EntryShell per row (description + live preview + always-visible evidence/notes
 * + formula footer). Theme-aware Sustally header, sector switcher, JSON import,
 * localStorage autosave, debounced live recalculation.
 *
 * Methodology = ICFPA/NCASI v1.4 + IPCC 2006 + AR5/AR6 GWPs.
 */

import {
  AlertCircle,
  Atom,
  Boxes,
  CheckCircle2,
  Droplets,
  Factory,
  FileText,
  Flame,
  Fuel,
  Hexagon,
  Info,
  Leaf,
  Moon,
  PenTool,
  Plus,
  Recycle,
  Snowflake,
  Sun,
  Trash2,
  TreePine,
  Truck,
  Wind,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { scope1Fetch, scope1SaveQuery } from '@/lib/scope1-api'
import { useAppDialog } from '@/components/app-dialog-provider'
import { Scope1ReviewContent, Scope1ReviewSubmittedContent } from '@/components/review/scope1-review-page'
import { buildScope1ReviewQuadrants } from '@/lib/scope1-review-build'
import { submitScope1ForReview } from '@/lib/scope1-submit-for-review'
import { useScope1OrganizationPrefill } from '@/lib/use-scope1-organization-prefill'
import { useScope1BoundaryPrefill } from '@/lib/use-scope1-boundary-prefill'
import { FactorOverridePanel } from '@/components/factor-override-panel'
import { PulpPaperMethodologyGuide } from '@/components/methodology-guide'
import { SourceApplicabilityPanel } from '@/components/source-applicability-panel'
import { WizardProgressNav } from '@/components/wizard-progress-nav'
import { useWizardTheme } from '@/lib/use-wizard-theme'
import { ReportSignoffPanel } from '@/components/report-signoff-panel'
import { AccessibleNumField, AccessibleSelect, AccessibleTextField } from '@/lib/ui/form-fields'
import { EntryLabelField } from '@/lib/ui/entry-label-field'
import { GwpSectorCards, GWP_OPTIONS_THREE } from '@/lib/ui/gwp-switch'
import { labelSuggestionsFor } from '@/lib/ui/label-suggestions'
import { uploadActivityExcel } from '@/lib/activity-import/client'
import { mergeImportedActivity } from '@/lib/activity-import/parse-excel'
import { formatNumber } from '@/lib/ui/locale'
import { categoryLabel, fuelLabel, gasLabel } from '@/lib/ui/labels'
import {
  applicabilityFlags,
  PULP_PAPER_INVENTORY_SOURCES,
  sourceApplicabilityComplete,
  updateSourceApplicability,
} from '@/lib/ui/source-catalog'
import {
  detectPulpPaperProfile,
  profileTitle,
  PULP_PAPER_PROFILES,
  pulpPaperMethodSummary,
} from '@/lib/ui/methodology'
import {
  ActivityDataShell,
  ByCategoryGasTable,
  CalculationTracePanel,
  CategorySummaryCards,
  driverGroupsFromCategories,
  EmissionsDriverChart,
  FactorSnapshotsPanel,
  InventoryStatusBanner,
  LiveTotalsStrip,
  ActivityDataTools,
  WizardStickyChrome,
  listInventoryVersions,
  ReconciliationPanel,
  ResultsViewTabs,
  StickyExportBar,
  VersionHistoryPanel,
  type ResultsTab,
} from '@/components/wizard-shared'
import { saveInventoryVersion } from '@/lib/ui/version-history'
import { activityCategoryFromFieldPath, scrollToFieldPath } from '@/lib/ui/field-navigation'
import { ActivityEmptyState, EntryLabeledSelect, codesToOptions } from '@/lib/ui/activity-fields'
import { calculatePulpPaper } from '@/lib/engine/pulppaper'
import type {
  AnaerobicWwtEntry,
  BiomassEntry,
  ChpAllocationEntry,
  Co2TransferEntry,
  FuelEntry,
  LandfillEntry,
  LimeKilnEntry,
  MakeupCarbonateEntry,
  MobileEntry,
  PulpPaperCalculationResult,
  PulpPaperGwpSet,
  PulpPaperInputPayload,
  RefrigerantEntry,
} from '@/lib/engine/pulppaper'
import type { ReportedEntry } from '@/lib/engine/oilgas'

const fmt = (v: number) => formatNumber(v, 2)
const fmt4 = (v: number) => formatNumber(v, 4)
const COL_GRID = '2.5fr 1fr 1fr 1fr 1fr'

type Num = number | null
function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}
function toNum(v: string): Num {
  if (v === '' || v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/* --------------------------------- badges --------------------------------- */

const S1_BADGE = <span className="entry-badge entry-badge-s1">Gross Scope 1 (CO2e)</span>
const S3_BADGE = <span className="entry-badge entry-badge-s3">Supporting Scope 3 (excluded)</span>
const MEMO_BADGE = <span className="entry-badge entry-badge-mixed">Biogenic CO2 → memo only</span>

/* ----------------------------- categories tab ----------------------------- */

type Cat =
  | 'production'
  | 'stationary'
  | 'biomass'
  | 'limeKiln'
  | 'makeup'
  | 'mobile'
  | 'landfill'
  | 'wwt'
  | 'refrigerant'
  | 'chp'
  | 'transfer'
  | 'reported'

const STEPS = ['Sector', 'Facility & methods', 'Activity data', 'Review & submit']

const CATEGORIES: {
  key: Cat
  label: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  appKey?: keyof PulpPaperInputPayload['sourceApplicability']
}[] = [
  { key: 'production', label: 'Production', icon: Boxes },
  { key: 'stationary', label: 'Stationary', icon: Flame, appKey: 'stationaryCombustion' },
  { key: 'biomass', label: 'Biomass', icon: TreePine, appKey: 'biomassCombustion' },
  { key: 'limeKiln', label: 'Lime kilns', icon: Factory, appKey: 'limeKilns' },
  { key: 'makeup', label: 'Make-up carbonates', icon: Hexagon, appKey: 'makeupCarbonates' },
  { key: 'mobile', label: 'Mobile', icon: Truck, appKey: 'mobile' },
  { key: 'landfill', label: 'Landfills', icon: Recycle, appKey: 'landfills' },
  { key: 'wwt', label: 'Anaerobic WWT', icon: Droplets, appKey: 'anaerobicWwt' },
  { key: 'refrigerant', label: 'Refrigerants', icon: Snowflake, appKey: 'refrigerants' },
  { key: 'chp', label: 'CHP allocation', icon: Zap, appKey: 'chpAllocation' },
  { key: 'transfer', label: 'CO2 transfers', icon: Wind, appKey: 'co2Transfers' },
  { key: 'reported', label: 'Reported', icon: FileText, appKey: 'reported' },
]

const PULP_ACTIVITY_HINTS: Record<Cat, string> = {
  production: 'Air-dry pulp, paper, and board volumes for intensity metrics on the report.',
  stationary: 'Power boilers, recovery furnaces, and other stationary combustion (fossil fraction to Scope 1).',
  biomass: 'Biogenic combustion reported as a memo item, not in gross Scope 1.',
  limeKiln: 'Lime kiln fuel use (kraft mills). Not applicable for recycled-only sites.',
  makeup: 'Make-up carbonate process emissions where applicable.',
  mobile: 'Mill-owned mobile equipment fuel use.',
  landfill: 'Landfill methane from on-site waste.',
  wwt: 'Anaerobic wastewater treatment methane.',
  refrigerant: 'Refrigerant leakage at the mill.',
  chp: 'CHP heat and power allocation when cogeneration is present.',
  transfer: 'Purchased or sold CO2 transfers (supporting disclosure).',
  reported: 'Optional disclosed totals for reconciliation against public reports.',
}

const MILL_APPLICABILITY_DEFAULTS: Record<PulpPaperInputPayload['facility']['millType'], PulpPaperInputPayload['sourceApplicability']> = {
  KRAFT:       { stationaryCombustion: true,  biomassCombustion: true,  limeKilns: true,  makeupCarbonates: true,  mobile: true, landfills: true,  anaerobicWwt: false, refrigerants: true, chpAllocation: true, co2Transfers: true, reported: true, purchasedElectricity: true },
  SULFITE:     { stationaryCombustion: true,  biomassCombustion: true,  limeKilns: false, makeupCarbonates: false, mobile: true, landfills: true,  anaerobicWwt: false, refrigerants: true, chpAllocation: true, co2Transfers: false, reported: true, purchasedElectricity: true },
  RECYCLED:    { stationaryCombustion: true,  biomassCombustion: false, limeKilns: false, makeupCarbonates: false, mobile: true, landfills: true,  anaerobicWwt: true,  refrigerants: true, chpAllocation: true, co2Transfers: false, reported: true, purchasedElectricity: true },
  MECHANICAL:  { stationaryCombustion: true,  biomassCombustion: false, limeKilns: false, makeupCarbonates: false, mobile: true, landfills: false, anaerobicWwt: false, refrigerants: true, chpAllocation: true, co2Transfers: false, reported: true, purchasedElectricity: true },
  PAPER_ONLY:  { stationaryCombustion: true,  biomassCombustion: false, limeKilns: false, makeupCarbonates: false, mobile: true, landfills: false, anaerobicWwt: false, refrigerants: true, chpAllocation: true, co2Transfers: false, reported: true, purchasedElectricity: true },
  INTEGRATED:  { stationaryCombustion: true,  biomassCombustion: true,  limeKilns: true,  makeupCarbonates: true,  mobile: true, landfills: true,  anaerobicWwt: true,  refrigerants: true, chpAllocation: true, co2Transfers: true, reported: true, purchasedElectricity: true },
  MIXED:       { stationaryCombustion: true,  biomassCombustion: true,  limeKilns: true,  makeupCarbonates: true,  mobile: true, landfills: true,  anaerobicWwt: true,  refrigerants: true, chpAllocation: true, co2Transfers: true, reported: true, purchasedElectricity: true },
}

/* ----------------------------- empty payload ----------------------------- */

function emptyPulpPaperPayload(): PulpPaperInputPayload {
  const year = new Date().getFullYear()
  return {
    calculationContext: {
      calculationType: 'ANNUAL_INVENTORY',
      reportingPeriod: { year, startDate: `${year}-01-01`, endDate: `${year}-12-31` },
      inventoryVersion: 'SUSTALLY_PP_V20',
      gwpSet: 'AR6_100',
    },
    organization: { name: '', country: 'IN', contactName: '', contactEmail: '', contactPhone: '', contactRole: '' },
    facility: { name: '', millType: 'KRAFT' },
    organizationBoundary: { boundaryMethod: 'OPERATIONAL_CONTROL', ownershipSharePercent: 100, consolidationPercent: 100 },
    sector: { sectorCode: 'PULP_PAPER' },
    methodSelections: { stationaryMethod: 'ENERGY_BASED', mobileMethod: 'FUEL_BASED', electricityMethod: 'LOCATION_BASED_SUPPORTING' },
    sourceApplicability: {
      stationaryCombustion: true,
      biomassCombustion: true,
      limeKilns: true,
      makeupCarbonates: true,
      mobile: true,
      landfills: true,
      anaerobicWwt: true,
      refrigerants: true,
      chpAllocation: true,
      co2Transfers: true,
      reported: true,
      purchasedElectricity: true,
    },
    activityData: {
      production: {},
      stationaryCombustion: [],
      biomassCombustion: [],
      limeKilns: [],
      makeupCarbonates: [],
      mobile: [],
      landfills: [],
      anaerobicWwt: [],
      refrigerants: [],
      chpAllocation: [],
      co2Transfers: [],
      reported: [],
      purchasedElectricity: { mwh: null, gridEfTco2PerMwh: null },
    },
    factorOverrides: {},
  }
}

/** A worked sample kraft mill — exercises every category at least once. */
function sampleKraftMill(): PulpPaperInputPayload {
  const p = emptyPulpPaperPayload()
  p.organization = { name: 'Sample Pulp & Paper Ltd', country: 'IN', contactName: 'Aditi Sharma', contactEmail: 'aditi.sharma@samplepp.example', contactPhone: '+91 98xxxxxxxx', contactRole: 'Head of Sustainability' }
  p.facility = { name: 'Karnataka Kraft Mill', millType: 'KRAFT', state: 'KA' }
  p.activityData.production = { airDryPulpTonnes: 320_000, paperProducedTonnes: 280_000 }
  p.activityData.stationaryCombustion = [
    { id: uid(), label: 'NG package boiler', fuelCode: 'natural_gas', technology: 'BOILER_OR_IR_DRYER', quantity: 12_000_000, quantityUnit: 'Sm3' },
  ]
  p.activityData.biomassCombustion = [
    { id: uid(), label: 'Black liquor recovery furnace', fuelCode: 'black_liquor', technology: 'KRAFT_RECOVERY_FURNACE', quantity: 280_000, quantityUnit: 'tonne_dry' },
    { id: uid(), label: 'Bark / hog fuel CFB', fuelCode: 'wood_bark', technology: 'CFB', quantity: 90_000, quantityUnit: 'tonne_dry' },
  ]
  p.activityData.limeKilns = [
    { id: uid(), label: 'Lime kiln #1', kilnType: 'LIME_KILN', fuelCode: 'natural_gas', fuelQuantity: 4_500_000, fuelQuantityUnit: 'Sm3' },
  ]
  p.activityData.makeupCarbonates = [
    { id: uid(), label: 'Make-up CaCO3 to causticizing', chemicalCode: 'CACO3', quantityTonnes: 4_000 },
  ]
  p.activityData.mobile = [
    { id: uid(), label: 'Yard truck fleet (diesel)', ownership: 'OWNED_CONTROLLED', vehicleCode: 'DIESEL_OFFROAD', quantity: 250_000, quantityUnit: 'L' },
  ]
  p.activityData.anaerobicWwt = [
    { id: uid(), label: 'UASB reactor', method: 'ACTIVITY_BASED', codLoadKg: 1_200_000 },
  ]
  p.activityData.refrigerants = [
    { id: uid(), label: 'Plant chillers (R-410A)', gasCode: 'r410a', method: 'MASS_BALANCE', inventoryStartKg: 600, purchasedKg: 35, soldKg: 0, inventoryEndKg: 600, recoveredForRecycleKg: 0 },
  ]
  p.activityData.purchasedElectricity = { mwh: 80_000, gridEfTco2PerMwh: null }
  return p
}

/* ----------------------------- draft autosave ----------------------------- */

const DRAFT_KEY = 'sustally:pulppaper:draft:v1'
function saveDraft(p: PulpPaperInputPayload) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(p)) } catch { /* ignore */ }
}
function loadDraft(): PulpPaperInputPayload | null {
  try { const raw = localStorage.getItem(DRAFT_KEY); return raw ? JSON.parse(raw) as PulpPaperInputPayload : null } catch { return null }
}
function draftIsMeaningful(p: PulpPaperInputPayload): boolean {
  const a = p?.activityData
  const hasName = !!p?.organization?.name?.trim() || !!p?.facility?.name?.trim()
  const hasAny =
    (a?.stationaryCombustion?.length ?? 0) > 0 ||
    (a?.biomassCombustion?.length ?? 0) > 0 ||
    (a?.limeKilns?.length ?? 0) > 0 ||
    (a?.makeupCarbonates?.length ?? 0) > 0 ||
    (a?.mobile?.length ?? 0) > 0 ||
    (a?.landfills?.length ?? 0) > 0 ||
    (a?.anaerobicWwt?.length ?? 0) > 0 ||
    (a?.refrigerants?.length ?? 0) > 0 ||
    (a?.chpAllocation?.length ?? 0) > 0 ||
    (a?.co2Transfers?.length ?? 0) > 0 ||
    (a?.reported?.length ?? 0) > 0
  return hasName || hasAny
}

/* --------------------------- shared form atoms --------------------------- */

function NumField(props: Parameters<typeof AccessibleNumField>[0]) {
  return <AccessibleNumField {...props} />
}

function RowPreview({ co2 }: { co2: number | null }) {
  if (co2 == null) return null
  return <span className="entry-preview">{fmt(co2)} tCO2e <span style={{ opacity: 0.6 }}>live</span></span>
}

type TraceEntry = { step: string; outputTonnesCO2?: number; [k: string]: unknown }
function traceOut(trace: TraceEntry[] | undefined, stepLabel: string): number | null {
  if (!trace) return null
  const t = [...trace].reverse().find((x) => x.step === stepLabel)
  return t && typeof t.outputTonnesCO2 === 'number' ? t.outputTonnesCO2 : null
}

function EntryShell({
  index, title, badge, co2, onRemove, children, formula, evidenceReference, notes, onEvidenceChange,
}: {
  index: number
  title: string
  badge: React.ReactNode
  co2: number | null
  onRemove: () => void
  children: React.ReactNode
  formula?: React.ReactNode
  evidenceReference?: string
  notes?: string
  onEvidenceChange?: (patch: { evidenceReference?: string; overrideReason?: string }) => void
}) {
  return (
    <div className="entry-card">
      <div className="entry-card-head">
        <div className="entry-card-head-left">
          <span className="entry-num">#{index + 1}</span>
          <span className="entry-title">{title}</span>
          {badge}
          <RowPreview co2={co2} />
        </div>
        <button className="entry-delete" onClick={onRemove}><Trash2 size={13} /> Remove</button>
      </div>
      {children}
      {onEvidenceChange && (
        <details className="entry-evidence" open={!!(evidenceReference || notes)}>
          <summary>Evidence &amp; notes</summary>
          <div className="field-row">
            <label className="field">Evidence reference
              <input value={evidenceReference ?? ''} placeholder="meter log · fuel invoice · lab report · LFG meter" onChange={(e) => onEvidenceChange({ evidenceReference: e.target.value })} />
            </label>
            <label className="field">Notes / override reason
              <input value={notes ?? ''} placeholder="assumptions, exclusions, or reason for any factor override" onChange={(e) => onEvidenceChange({ overrideReason: e.target.value })} />
            </label>
          </div>
        </details>
      )}
      {formula && <div className="entry-formula">{formula}</div>}
    </div>
  )
}

/* ------------------------------- tables ----------------------------------- */

function StationaryTable({ entries, trace, onChange }: { entries: FuelEntry[]; trace: TraceEntry[] | undefined; onChange: (rows: FuelEntry[]) => void }) {
  const upd = (id: string, mut: (f: FuelEntry) => void) => onChange(entries.map((e) => e.id === id ? (() => { const c = { ...e }; mut(c); return c })() : e))
  const add = () => onChange([...entries, { id: uid(), label: 'Power boiler', fuelCode: 'natural_gas', technology: 'BOILER_OR_IR_DRYER', quantity: null, quantityUnit: 'Sm3' }])
  const FUELS = ['natural_gas','refinery_fuel_gas','diesel','residual_oil','lpg','bituminous_coal','sub_bituminous_coal','lignite','anthracite','peat','petcoke','coke_oven_gas','gasoline','kerosene','crude_oil']
  const TECHS = ['BOILER_OR_IR_DRYER','TURBINE_OVER_3MW','ENGINE_2STROKE_LEAN','ENGINE_4STROKE_LEAN','ENGINE_4STROKE_RICH','OVERFEED_STOKER','UNDERFEED_STOKER','PULVERIZED_DRY_WALL','PULVERIZED_DRY_TANGENTIAL','PULVERIZED_WET','SPREADER_STOKER','CFB','BOILER']
  return (
    <div className="form-card">
      <h2>Stationary fossil-fuel combustion</h2>
      <p className="form-sub">Boilers, IR dryers, RTOs, gas turbines, engines. Fossil CO2 + CH4 + N2O are gross Scope 1. CFB boilers have N2O ~10× higher than other configurations.</p>
      {entries.length === 0 ? (
        <ActivityEmptyState title="No fuel rows yet" hint="Add boilers, dryers, turbines, or engines." onAdd={add} addLabel="Add fuel" />
      ) : null}
      {entries.map((e, i) => (
        <EntryShell key={e.id} index={i} title={e.label || '(unnamed fuel)'} badge={S1_BADGE} co2={traceOut(trace, `Stationary - ${e.label}`)}
          onRemove={() => onChange(entries.filter((x) => x.id !== e.id))}
          evidenceReference={e.evidenceReference} notes={e.overrideReason}
          onEvidenceChange={(patch) => upd(e.id, (x) => Object.assign(x, patch))}
          formula={<>quantity × NCV ÷ 1000 × CO2 EF = tCO2 · CH4/N2O = energy × EF_tech / 1000 · fossil → Scope 1</>}>
          <div className="entry-card-section">
            <div className="field-row">
              <EntryLabelField value={e.label} onChange={(v) => upd(e.id, (f) => (f.label = v))} suggestions={labelSuggestionsFor('pulp_paper', 'combustion')} />
              <EntryLabeledSelect
                label="Fuel"
                value={e.fuelCode}
                onChange={(v) => upd(e.id, (f) => (f.fuelCode = v))}
                options={codesToOptions(FUELS, fuelLabel)}
              />
              <EntryLabeledSelect
                label="Combustion tech"
                value={e.technology ?? 'BOILER_OR_IR_DRYER'}
                onChange={(v) => upd(e.id, (f) => (f.technology = v))}
                options={codesToOptions(TECHS, (c) => c.toLowerCase().replace(/_/g, ' '))}
              />
              <NumField label="Quantity" unit={e.quantityUnit} value={e.quantity} onChange={(v) => upd(e.id, (f) => (f.quantity = v))} />
            </div>
            <div className="field-row">
              <EntryLabeledSelect
                label="Unit"
                value={e.quantityUnit}
                onChange={(v) => upd(e.id, (f) => (f.quantityUnit = v))}
                options={codesToOptions(['Sm3', 'tonne', 'L', 'kg', 'GJ'])}
              />
              <NumField label="NCV override" unit={`GJ/${e.quantityUnit}`} step="0.0001" value={e.ncvGjPerUnit ?? null} onChange={(v) => upd(e.id, (f) => (f.ncvGjPerUnit = v))} hint="blank = library" />
              <NumField label="CO2 EF override" unit="kg/GJ" step="0.01" value={e.co2EfKgPerGj ?? null} onChange={(v) => upd(e.id, (f) => (f.co2EfKgPerGj = v))} hint="blank = library" />
            </div>
          </div>
        </EntryShell>
      ))}
      <button className="add-entry-btn" onClick={add}><Plus size={15} /> Add fuel</button>
    </div>
  )
}

function BiomassTable({ entries, trace, onChange }: { entries: BiomassEntry[]; trace: TraceEntry[] | undefined; onChange: (rows: BiomassEntry[]) => void }) {
  const upd = (id: string, mut: (f: BiomassEntry) => void) => onChange(entries.map((e) => e.id === id ? (() => { const c = { ...e }; mut(c); return c })() : e))
  const add = () => onChange([...entries, { id: uid(), label: 'Bark boiler', fuelCode: 'wood_bark', technology: 'CFB', quantity: null, quantityUnit: 'tonne_dry' }])
  const FUELS = ['wood_bark','black_liquor','spent_sulphite_liquor','biogas','ncg']
  const TECHS = ['STOKER_BOILER','CFB','BFB','KRAFT_RECOVERY_FURNACE','SULFITE_RECOVERY_FURNACE','BOILER','KILN']
  return (
    <div className="form-card">
      <h2>Biomass combustion (CH4 + N2O — biogenic CO2 = memo)</h2>
      <p className="form-sub">Wood, bark, hog fuel, black liquor, sulphite liquor, biogas, NCG. <b>Biogenic CO2 is a separate memo</b> and excluded from gross Scope 1; CH4 and N2O ARE in gross Scope 1.</p>
      {entries.length === 0 ? (
        <ActivityEmptyState title="No biomass rows yet" hint="Add wood, bark, black liquor, or other biomass fuels." onAdd={add} addLabel="Add biomass" />
      ) : null}
      {entries.map((e, i) => (
        <EntryShell key={e.id} index={i} title={e.label || '(unnamed biomass)'} badge={MEMO_BADGE} co2={traceOut(trace, `Biomass - ${e.label}`)}
          onRemove={() => onChange(entries.filter((x) => x.id !== e.id))}
          evidenceReference={e.evidenceReference} notes={e.overrideReason}
          onEvidenceChange={(patch) => upd(e.id, (x) => Object.assign(x, patch))}
          formula={<>biogenic CO2 (memo) = E × EFco2 / 1000 · CH4 + N2O (Scope 1) = E × EF_tech / 1000</>}>
          <div className="entry-card-section">
            <div className="field-row">
              <EntryLabelField value={e.label} onChange={(v) => upd(e.id, (f) => (f.label = v))} suggestions={labelSuggestionsFor('pulp_paper', 'combustion')} />
              <EntryLabeledSelect
                label="Biomass fuel"
                value={e.fuelCode}
                onChange={(v) => upd(e.id, (f) => (f.fuelCode = v))}
                options={codesToOptions(FUELS, fuelLabel)}
              />
              <EntryLabeledSelect
                label="Combustion tech"
                value={e.technology ?? 'CFB'}
                onChange={(v) => upd(e.id, (f) => (f.technology = v))}
                options={codesToOptions(TECHS, (c) => c.toLowerCase().replace(/_/g, ' '))}
              />
              <NumField label="Quantity" unit={e.quantityUnit} value={e.quantity} onChange={(v) => upd(e.id, (f) => (f.quantity = v))} />
            </div>
            <div className="field-row">
              <NumField label="NCV override" unit={`GJ/${e.quantityUnit}`} step="0.0001" value={e.ncvGjPerUnit ?? null} onChange={(v) => upd(e.id, (f) => (f.ncvGjPerUnit = v))} hint="blank = library" />
              <NumField label="Biogenic CO2 EF" unit="kg/GJ" step="0.1" value={e.biogenicCo2EfKgPerGj ?? null} onChange={(v) => upd(e.id, (f) => (f.biogenicCo2EfKgPerGj = v))} hint="memo only" />
            </div>
          </div>
        </EntryShell>
      ))}
      <button className="add-entry-btn" onClick={add}><Plus size={15} /> Add biomass</button>
    </div>
  )
}

function LimeKilnTable({ entries, trace, onChange }: { entries: LimeKilnEntry[]; trace: TraceEntry[] | undefined; onChange: (rows: LimeKilnEntry[]) => void }) {
  const upd = (id: string, mut: (f: LimeKilnEntry) => void) => onChange(entries.map((e) => e.id === id ? (() => { const c = { ...e }; mut(c); return c })() : e))
  const add = () => onChange([...entries, { id: uid(), label: 'Lime kiln', kilnType: 'LIME_KILN', fuelCode: 'natural_gas', fuelQuantity: null, fuelQuantityUnit: 'Sm3' }])
  return (
    <div className="form-card">
      <h2>Lime kilns &amp; calciners</h2>
      <p className="form-sub">Kraft mill recovery. Fossil-fuel CO2/CH4/N2O are gross Scope 1; CaCO3 calcination CO2 is biogenic (recovery-cycle carbon) → memo only.</p>
      {entries.length === 0 ? (
        <ActivityEmptyState title="No lime kilns yet" hint="Add lime kilns or calciners for kraft recovery." onAdd={add} addLabel="Add kiln" />
      ) : null}
      {entries.map((e, i) => (
        <EntryShell key={e.id} index={i} title={e.label || '(unnamed kiln)'} badge={S1_BADGE} co2={traceOut(trace, `Lime kiln - ${e.label}`)}
          onRemove={() => onChange(entries.filter((x) => x.id !== e.id))}
          evidenceReference={e.evidenceReference} notes={e.overrideReason}
          onEvidenceChange={(patch) => upd(e.id, (x) => Object.assign(x, patch))}
          formula={<>fossil CO2 = E × EFco2 / 1000 · CH4 = E × 0.0027 / 1000 · N2O kiln=0 / calciner=0.1–0.3</>}>
          <div className="entry-card-section">
            <div className="field-row">
              <EntryLabelField value={e.label} onChange={(v) => upd(e.id, (f) => (f.label = v))} suggestions={labelSuggestionsFor('pulp_paper', 'combustion')} />
              <EntryLabeledSelect
                label="Type"
                value={e.kilnType}
                onChange={(v) => upd(e.id, (f) => (f.kilnType = v as LimeKilnEntry['kilnType']))}
                options={[
                  { value: 'LIME_KILN', label: 'Lime kiln (rotary)' },
                  { value: 'CALCINER', label: 'Calciner (fluidized bed)' },
                ]}
              />
              <EntryLabeledSelect
                label="Fossil fuel"
                value={e.fuelCode}
                onChange={(v) => upd(e.id, (f) => (f.fuelCode = v))}
                options={codesToOptions(['natural_gas', 'residual_oil', 'diesel', 'lpg', 'biogas'], fuelLabel)}
              />
              <NumField label="Fuel qty" unit={e.fuelQuantityUnit} value={e.fuelQuantity} onChange={(v) => upd(e.id, (f) => (f.fuelQuantity = v))} />
            </div>
            <div className="field-row">
              <NumField label="Biogenic CaCO3 calcination CO2" unit="tCO2 (memo)" value={e.biogenicCo2FromCalcinationTonnes ?? null} onChange={(v) => upd(e.id, (f) => (f.biogenicCo2FromCalcinationTonnes = v))} hint="excluded from gross" />
              <NumField label="NCV override" unit={`GJ/${e.fuelQuantityUnit}`} step="0.0001" value={e.ncvGjPerUnit ?? null} onChange={(v) => upd(e.id, (f) => (f.ncvGjPerUnit = v))} hint="blank = library" />
            </div>
          </div>
        </EntryShell>
      ))}
      <button className="add-entry-btn" onClick={add}><Plus size={15} /> Add kiln</button>
    </div>
  )
}

function MakeupTable({ entries, trace, onChange }: { entries: MakeupCarbonateEntry[]; trace: TraceEntry[] | undefined; onChange: (rows: MakeupCarbonateEntry[]) => void }) {
  const upd = (id: string, mut: (f: MakeupCarbonateEntry) => void) => onChange(entries.map((e) => e.id === id ? (() => { const c = { ...e }; mut(c); return c })() : e))
  const add = () => onChange([...entries, { id: uid(), label: 'Make-up CaCO3', chemicalCode: 'CACO3', quantityTonnes: null }])
  return (
    <div className="form-card">
      <h2>Make-up carbonates / FGD sorbents</h2>
      <p className="form-sub">Stoichiometric process CO2 from mined limestone / soda ash. CaCO3 0.440 · Na2CO3 0.415 · Dolomite 0.477 tCO2/t. Fossil origin → Scope 1; biogenic origin → memo.</p>
      {entries.length === 0 ? (
        <ActivityEmptyState title="No make-up carbonates yet" hint="Add limestone, soda ash, or other make-up carbonates." onAdd={add} addLabel="Add carbonate" />
      ) : null}
      {entries.map((e, i) => (
        <EntryShell key={e.id} index={i} title={e.label || '(unnamed)'} badge={S1_BADGE} co2={traceOut(trace, `Makeup carbonate - ${e.label}`)}
          onRemove={() => onChange(entries.filter((x) => x.id !== e.id))}
          evidenceReference={e.evidenceReference} notes={e.overrideReason}
          onEvidenceChange={(patch) => upd(e.id, (x) => Object.assign(x, patch))}
          formula={<>CO2 = quantity × stoichiometric factor (CaCO3 0.440 · Na2CO3 0.415 · Dolomite 0.477)</>}>
          <div className="entry-card-section">
            <div className="field-row">
              <EntryLabelField value={e.label} onChange={(v) => upd(e.id, (f) => (f.label = v))} suggestions={labelSuggestionsFor('pulp_paper', 'combustion')} />
              <EntryLabeledSelect
                label="Chemical"
                value={e.chemicalCode}
                onChange={(v) => upd(e.id, (f) => (f.chemicalCode = v as MakeupCarbonateEntry['chemicalCode']))}
                options={[
                  { value: 'CACO3', label: 'CaCO3 (calcium carbonate)' },
                  { value: 'NA2CO3', label: 'Na2CO3 (soda ash)' },
                  { value: 'DOLOMITE', label: 'Dolomite (CaCO3·MgCO3)' },
                ]}
              />
              <NumField label="Quantity" unit="t" value={e.quantityTonnes} onChange={(v) => upd(e.id, (f) => (f.quantityTonnes = v))} />
              <EntryLabeledSelect
                label="Origin"
                value={e.fossilOrigin === false ? 'BIOGENIC' : 'FOSSIL'}
                onChange={(v) => upd(e.id, (f) => (f.fossilOrigin = v === 'FOSSIL'))}
                options={[
                  { value: 'FOSSIL', label: 'Fossil (mined / Solvay) -> Scope 1' },
                  { value: 'BIOGENIC', label: 'Biogenic -> memo only' },
                ]}
              />
            </div>
          </div>
        </EntryShell>
      ))}
      <button className="add-entry-btn" onClick={add}><Plus size={15} /> Add carbonate</button>
    </div>
  )
}

function MobileTable({ entries, trace, onChange }: { entries: MobileEntry[]; trace: TraceEntry[] | undefined; onChange: (rows: MobileEntry[]) => void }) {
  const upd = (id: string, mut: (f: MobileEntry) => void) => onChange(entries.map((e) => e.id === id ? (() => { const c = { ...e }; mut(c); return c })() : e))
  const add = () => onChange([...entries, { id: uid(), label: 'Yard truck', ownership: 'OWNED_CONTROLLED', vehicleCode: 'DIESEL_OFFROAD', quantity: null, quantityUnit: 'L' }])
  const VEH = ['DIESEL_OFFROAD','DIESEL_FORESTRY','GASOLINE_4STROKE','GASOLINE_2STROKE_INDUSTRY','GASOLINE_2STROKE_FORESTRY','LPG_MOBILE','NATGAS_MOBILE']
  return (
    <div className="form-card">
      <h2>Mobile / on-site equipment</h2>
      <p className="form-sub">Plant-owned or operationally-controlled fleet (forklifts, log loaders, yard trucks, forestry equipment). Third-party transport is <b>Scope 3</b> and excluded from gross.</p>
      {entries.length === 0 ? (
        <ActivityEmptyState title="No mobile rows yet" hint="Add forklifts, yard trucks, or other on-site equipment." onAdd={add} addLabel="Add equipment" />
      ) : null}
      {entries.map((e, i) => (
        <EntryShell key={e.id} index={i} title={e.label || '(unnamed mobile)'} badge={e.ownership === 'OWNED_CONTROLLED' ? S1_BADGE : S3_BADGE} co2={traceOut(trace, `${e.ownership === 'OWNED_CONTROLLED' ? 'Mobile (owned)' : 'Mobile (third-party, supporting Scope 3, EXCLUDED)'} - ${e.label}`)}
          onRemove={() => onChange(entries.filter((x) => x.id !== e.id))}
          evidenceReference={e.evidenceReference} notes={e.overrideReason}
          onEvidenceChange={(patch) => upd(e.id, (x) => Object.assign(x, patch))}
          formula={<>E = qty × NCV × EF / 1000 (CO2/CH4/N2O). N2O is the dominant non-CO2 GHG for diesel off-road.</>}>
          <div className="entry-card-section">
            <div className="field-row">
              <EntryLabelField value={e.label} onChange={(v) => upd(e.id, (f) => (f.label = v))} suggestions={labelSuggestionsFor('pulp_paper', 'combustion')} />
              <EntryLabeledSelect
                label="Ownership"
                value={e.ownership}
                onChange={(v) => upd(e.id, (f) => (f.ownership = v as MobileEntry['ownership']))}
                options={[
                  { value: 'OWNED_CONTROLLED', label: 'Owned / controlled (Scope 1)' },
                  { value: 'THIRD_PARTY', label: 'Third-party (Scope 3, excluded)' },
                ]}
              />
              <EntryLabeledSelect
                label="Vehicle / fuel type"
                value={e.vehicleCode}
                onChange={(v) => upd(e.id, (f) => (f.vehicleCode = v))}
                options={codesToOptions(VEH, (c) => c.toLowerCase().replace(/_/g, ' '))}
              />
              <NumField label="Fuel quantity" unit={e.quantityUnit} value={e.quantity} onChange={(v) => upd(e.id, (f) => (f.quantity = v))} />
            </div>
          </div>
        </EntryShell>
      ))}
      <button className="add-entry-btn" onClick={add}><Plus size={15} /> Add equipment</button>
    </div>
  )
}

function LandfillTable({ entries, trace, onChange }: { entries: LandfillEntry[]; trace: TraceEntry[] | undefined; onChange: (rows: LandfillEntry[]) => void }) {
  const upd = (id: string, mut: (f: LandfillEntry) => void) => onChange(entries.map((e) => e.id === id ? (() => { const c = { ...e }; mut(c); return c })() : e))
  const add = () => onChange([...entries, { id: uid(), label: 'Mill landfill', method: 'SIMPLIFIED_FOD', annualDepositDryMg: null, yearsSinceOpening: null }])
  return (
    <div className="form-card">
      <h2>Mill-owned landfills (CH4)</h2>
      <p className="form-sub">Receives sludge, ash, rejects. CH4 is biogenic but IS Scope 1 (the carbon-neutrality convention only excludes biogenic CO2). Two methods: direct LFG measurement (with collection) or simplified First Order Decay.</p>
      {entries.length === 0 ? (
        <ActivityEmptyState title="No landfills yet" hint="Add on-site landfills receiving sludge, ash, or rejects." onAdd={add} addLabel="Add landfill" />
      ) : null}
      {entries.map((e, i) => (
        <EntryShell key={e.id} index={i} title={e.label || '(unnamed landfill)'} badge={S1_BADGE} co2={traceOut(trace, `Landfill - ${e.label}`)}
          onRemove={() => onChange(entries.filter((x) => x.id !== e.id))}
          evidenceReference={e.evidenceReference} notes={e.overrideReason}
          onEvidenceChange={(patch) => upd(e.id, (x) => Object.assign(x, patch))}
          formula={e.method === 'DIRECT_GAS_MEASUREMENT'
            ? <>CH4 m3 = (REC/FRCOLL)·(1−FRCOLL)·FRMETH·(1−OX) + REC·FRMETH·(1−FRBURN); ×0.72/1000 → t</>
            : <>CH4 generated = R · L0 · (e^(−kC) − e^(−kT)); released = (gen−recov)(1−OX) + recov(1−FRBURN)</>}>
          <div className="entry-card-section">
            <div className="field-row">
              <EntryLabelField value={e.label} onChange={(v) => upd(e.id, (f) => (f.label = v))} suggestions={labelSuggestionsFor('pulp_paper', 'combustion')} />
              <EntryLabeledSelect
                label="Method"
                value={e.method}
                onChange={(v) => upd(e.id, (f) => (f.method = v as LandfillEntry['method']))}
                options={[
                  { value: 'SIMPLIFIED_FOD', label: 'Simplified FOD (constant deposit)' },
                  { value: 'DIRECT_GAS_MEASUREMENT', label: 'Direct LFG measurement' },
                ]}
              />
            </div>
            {e.method === 'SIMPLIFIED_FOD' ? (
              <div className="field-row">
                <NumField label="Annual deposit (R)" unit="dry Mg/yr" value={e.annualDepositDryMg ?? null} onChange={(v) => upd(e.id, (f) => (f.annualDepositDryMg = v))} />
                <NumField label="Years since opening (T)" unit="yr" value={e.yearsSinceOpening ?? null} onChange={(v) => upd(e.id, (f) => (f.yearsSinceOpening = v))} />
                <NumField label="Years since closure (C)" unit="yr" value={e.yearsSinceClosure ?? null} onChange={(v) => upd(e.id, (f) => (f.yearsSinceClosure = v))} hint="0 if active" />
                <NumField label="L0 override" unit="m3/Mg" value={e.methanePotentialM3PerMg ?? null} onChange={(v) => upd(e.id, (f) => (f.methanePotentialM3PerMg = v))} hint="default 100" />
              </div>
            ) : (
              <div className="field-row">
                <NumField label="Collected LFG (REC)" unit="Nm3/yr" value={e.collectedGasNm3 ?? null} onChange={(v) => upd(e.id, (f) => (f.collectedGasNm3 = v))} />
                <NumField label="Collection efficiency (FRCOLL)" step="0.01" value={e.collectionEfficiency ?? null} onChange={(v) => upd(e.id, (f) => (f.collectionEfficiency = v))} hint="default 0.75" />
                <NumField label="CH4 fraction (FRMETH)" step="0.01" value={e.methaneFraction ?? null} onChange={(v) => upd(e.id, (f) => (f.methaneFraction = v))} hint="default 0.5" />
                <NumField label="Fraction burned (FRBURN)" step="0.01" value={e.fractionBurned ?? null} onChange={(v) => upd(e.id, (f) => (f.fractionBurned = v))} hint="0=vented, 1=flared" />
              </div>
            )}
          </div>
        </EntryShell>
      ))}
      <button className="add-entry-btn" onClick={add}><Plus size={15} /> Add landfill</button>
    </div>
  )
}

function WwtTable({ entries, trace, onChange }: { entries: AnaerobicWwtEntry[]; trace: TraceEntry[] | undefined; onChange: (rows: AnaerobicWwtEntry[]) => void }) {
  const upd = (id: string, mut: (f: AnaerobicWwtEntry) => void) => onChange(entries.map((e) => e.id === id ? (() => { const c = { ...e }; mut(c); return c })() : e))
  const add = () => onChange([...entries, { id: uid(), label: 'UASB reactor', method: 'ACTIVITY_BASED', codLoadKg: null }])
  return (
    <div className="form-card">
      <h2>Anaerobic wastewater treatment / sludge digestion</h2>
      <p className="form-sub">UASB, EGSB, IC reactors, lagoons, and dedicated anaerobic sludge digesters. CH4 is Scope 1. Aerobic systems are assumed negligible.</p>
      {entries.length === 0 ? (
        <ActivityEmptyState title="No anaerobic WWT yet" hint="Add UASB reactors, lagoons, or sludge digesters." onAdd={add} addLabel="Add WWT" />
      ) : null}
      {entries.map((e, i) => (
        <EntryShell key={e.id} index={i} title={e.label || '(unnamed WWT)'} badge={S1_BADGE} co2={traceOut(trace, `Anaerobic WWT - ${e.label}`)}
          onRemove={() => onChange(entries.filter((x) => x.id !== e.id))}
          evidenceReference={e.evidenceReference} notes={e.overrideReason}
          onEvidenceChange={(patch) => upd(e.id, (x) => Object.assign(x, patch))}
          formula={e.method === 'GAS_CAPTURE' ? <>CH4 m3 = (Q/FRCOLL)·(1−FRCOLL)·FRMETH + Q·FRMETH·(1−FRBURN); ×0.72/1000 → t</> : <>CH4 kg = OC × EF − B (COD: 0.25; BOD: 0.6)</>}>
          <div className="entry-card-section">
            <div className="field-row">
              <EntryLabelField value={e.label} onChange={(v) => upd(e.id, (f) => (f.label = v))} suggestions={labelSuggestionsFor('pulp_paper', 'combustion')} />
              <EntryLabeledSelect
                label="Method"
                value={e.method}
                onChange={(v) => upd(e.id, (f) => (f.method = v as AnaerobicWwtEntry['method']))}
                options={[
                  { value: 'ACTIVITY_BASED', label: 'Activity-based (no gas data)' },
                  { value: 'GAS_CAPTURE', label: 'Gas capture (collected LFG / biogas)' },
                ]}
              />
            </div>
            {e.method === 'ACTIVITY_BASED' ? (
              <div className="field-row">
                <NumField label="COD load" unit="kg/yr" value={e.codLoadKg ?? null} onChange={(v) => upd(e.id, (f) => (f.codLoadKg = v))} hint="preferred basis" />
                <NumField label="…or BOD load" unit="kg/yr" value={e.bodLoadKg ?? null} onChange={(v) => upd(e.id, (f) => (f.bodLoadKg = v))} />
                <NumField label="CH4 captured / burned" unit="kg/yr" value={e.ch4CapturedKg ?? null} onChange={(v) => upd(e.id, (f) => (f.ch4CapturedKg = v))} hint="subtracted from emissions" />
              </div>
            ) : (
              <div className="field-row">
                <NumField label="Collected biogas (Q)" unit="Nm3/yr" value={e.collectedGasNm3 ?? null} onChange={(v) => upd(e.id, (f) => (f.collectedGasNm3 = v))} />
                <NumField label="Collection efficiency (FRCOLL)" step="0.01" value={e.collectionEfficiency ?? null} onChange={(v) => upd(e.id, (f) => (f.collectionEfficiency = v))} hint="1.0 odor-tight; 0.95 engineered; 0.5 open lagoon" />
                <NumField label="Fraction burned (FRBURN)" step="0.01" value={e.fractionBurned ?? null} onChange={(v) => upd(e.id, (f) => (f.fractionBurned = v))} hint="1.0 if flared" />
              </div>
            )}
          </div>
        </EntryShell>
      ))}
      <button className="add-entry-btn" onClick={add}><Plus size={15} /> Add WWT</button>
    </div>
  )
}

function RefrigerantTable({ entries, trace, onChange }: { entries: RefrigerantEntry[]; trace: TraceEntry[] | undefined; onChange: (rows: RefrigerantEntry[]) => void }) {
  const upd = (id: string, mut: (f: RefrigerantEntry) => void) => onChange(entries.map((e) => e.id === id ? (() => { const c = { ...e }; mut(c); return c })() : e))
  const add = () => onChange([...entries, { id: uid(), label: 'Industrial chiller', gasCode: 'r410a', method: 'MASS_BALANCE' }])
  return (
    <div className="form-card">
      <h2>Refrigerant HFC fugitives</h2>
      <p className="form-sub">Chillers, process refrigeration, AC. HFC GWPs use the 100-year basis regardless of the chosen CH4 horizon (industry convention).</p>
      {entries.length === 0 ? (
        <ActivityEmptyState title="No refrigerants yet" hint="Add chillers, process refrigeration, or AC units." onAdd={add} addLabel="Add refrigerant" />
      ) : null}
      {entries.map((e, i) => (
        <EntryShell key={e.id} index={i} title={e.label || '(unnamed refrigerant)'} badge={S1_BADGE} co2={traceOut(trace, `Refrigerant - ${e.label}`)}
          onRemove={() => onChange(entries.filter((x) => x.id !== e.id))}
          evidenceReference={e.evidenceReference} notes={e.overrideReason}
          onEvidenceChange={(patch) => upd(e.id, (x) => Object.assign(x, patch))}
          formula={e.method === 'MASS_BALANCE' ? <>E = inv_start + purchased − sold − inv_end − recovered; CO2e = E × GWP / 1000</> : <>E = charge × annual_leak_rate; CO2e = E × GWP / 1000</>}>
          <div className="entry-card-section">
            <div className="field-row">
              <EntryLabelField value={e.label} onChange={(v) => upd(e.id, (f) => (f.label = v))} suggestions={labelSuggestionsFor('pulp_paper', 'combustion')} />
              <EntryLabeledSelect
                label="Gas"
                value={e.gasCode}
                onChange={(v) => upd(e.id, (f) => (f.gasCode = v))}
                options={codesToOptions(['r134a', 'r410a', 'r404a', 'r407c', 'r32', 'r507a', 'r23', 'r125', 'r143a', 'r449a', 'r1234yf'], gasLabel)}
              />
              <EntryLabeledSelect
                label="Method"
                value={e.method}
                onChange={(v) => upd(e.id, (f) => (f.method = v as RefrigerantEntry['method']))}
                options={[
                  { value: 'MASS_BALANCE', label: 'Mass balance (preferred)' },
                  { value: 'SCREENING', label: 'Screening (charge x leak rate)' },
                ]}
              />
            </div>
            {e.method === 'MASS_BALANCE' ? (
              <>
                <div className="field-row">
                  <NumField label="Inventory start" unit="kg" value={e.inventoryStartKg ?? null} onChange={(v) => upd(e.id, (f) => (f.inventoryStartKg = v))} />
                  <NumField label="Purchased" unit="kg" value={e.purchasedKg ?? null} onChange={(v) => upd(e.id, (f) => (f.purchasedKg = v))} />
                  <NumField label="Sold" unit="kg" value={e.soldKg ?? null} onChange={(v) => upd(e.id, (f) => (f.soldKg = v))} />
                </div>
                <div className="field-row">
                  <NumField label="Inventory end" unit="kg" value={e.inventoryEndKg ?? null} onChange={(v) => upd(e.id, (f) => (f.inventoryEndKg = v))} />
                  <NumField label="Recovered for recycle" unit="kg" value={e.recoveredForRecycleKg ?? null} onChange={(v) => upd(e.id, (f) => (f.recoveredForRecycleKg = v))} />
                  <NumField label="GWP override" value={e.gwpOverride ?? null} onChange={(v) => upd(e.id, (f) => (f.gwpOverride = v))} hint="blank = AR6 library" />
                </div>
              </>
            ) : (
              <div className="field-row">
                <NumField label="Charge" unit="kg" value={e.chargeKg ?? null} onChange={(v) => upd(e.id, (f) => (f.chargeKg = v))} />
                <NumField label="Annual leak rate" step="0.001" value={e.annualLeakRate ?? null} onChange={(v) => upd(e.id, (f) => (f.annualLeakRate = v))} hint="0–1; chillers ~0.02–0.10" />
                <NumField label="GWP override" value={e.gwpOverride ?? null} onChange={(v) => upd(e.id, (f) => (f.gwpOverride = v))} hint="blank = AR6 library" />
              </div>
            )}
          </div>
        </EntryShell>
      ))}
      <button className="add-entry-btn" onClick={add}><Plus size={15} /> Add refrigerant</button>
    </div>
  )
}

function ChpTable({ entries, trace, onChange }: { entries: ChpAllocationEntry[]; trace: TraceEntry[] | undefined; onChange: (rows: ChpAllocationEntry[]) => void }) {
  const upd = (id: string, mut: (f: ChpAllocationEntry) => void) => onChange(entries.map((e) => e.id === id ? (() => { const c = { ...e }; mut(c); return c })() : e))
  const add = () => onChange([...entries, { id: uid(), label: 'On-site CHP', totalEmissionsCo2eTonnes: null, heatOutputGj: null, powerOutputGj: null }])
  return (
    <div className="form-card">
      <h2>CHP heat / power allocation (analytical only)</h2>
      <p className="form-sub">Apportions an already-counted CHP total between heat and power outputs per the WRI/WBCSD Simplified Efficiency Method. <b>This does not change gross Scope 1</b> — it derives EF for heat and power separately for sold-energy disclosure.</p>
      {entries.length === 0 ? (
        <ActivityEmptyState title="No CHP units yet" hint="Add on-site cogeneration for heat and power allocation." onAdd={add} addLabel="Add CHP" />
      ) : null}
      {entries.map((e, i) => (
        <EntryShell key={e.id} index={i} title={e.label || '(unnamed CHP)'} badge={<span className="entry-badge entry-badge-mixed">analytical (not added to gross)</span>} co2={traceOut(trace, `CHP allocation - ${e.label}`)}
          onRemove={() => onChange(entries.filter((x) => x.id !== e.id))}
          evidenceReference={e.evidenceReference} notes={e.overrideReason}
          onEvidenceChange={(patch) => upd(e.id, (x) => Object.assign(x, patch))}
          formula={<>Reff = eH / eP; EH = H / (H + P·Reff) × ET; EP = ET − EH</>}>
          <div className="entry-card-section">
            <div className="field-row">
              <EntryLabelField value={e.label} onChange={(v) => upd(e.id, (f) => (f.label = v))} suggestions={labelSuggestionsFor('pulp_paper', 'combustion')} />
              <NumField label="Total emissions" unit="tCO2e" value={e.totalEmissionsCo2eTonnes} onChange={(v) => upd(e.id, (f) => (f.totalEmissionsCo2eTonnes = v))} />
              <NumField label="Heat output (H)" unit="GJ" value={e.heatOutputGj} onChange={(v) => upd(e.id, (f) => (f.heatOutputGj = v))} />
              <NumField label="Power output (P)" unit="GJ" value={e.powerOutputGj} onChange={(v) => upd(e.id, (f) => (f.powerOutputGj = v))} />
            </div>
            <div className="field-row">
              <NumField label="Heat efficiency (eH)" step="0.01" value={e.heatEfficiency ?? null} onChange={(v) => upd(e.id, (f) => (f.heatEfficiency = v))} hint="default 0.80" />
              <NumField label="Power efficiency (eP)" step="0.01" value={e.powerEfficiency ?? null} onChange={(v) => upd(e.id, (f) => (f.powerEfficiency = v))} hint="default 0.35" />
            </div>
          </div>
        </EntryShell>
      ))}
      <button className="add-entry-btn" onClick={add}><Plus size={15} /> Add CHP</button>
    </div>
  )
}

function TransferTable({ entries, trace, onChange }: { entries: Co2TransferEntry[]; trace: TraceEntry[] | undefined; onChange: (rows: Co2TransferEntry[]) => void }) {
  const upd = (id: string, mut: (f: Co2TransferEntry) => void) => onChange(entries.map((e) => e.id === id ? (() => { const c = { ...e }; mut(c); return c })() : e))
  const add = () => onChange([...entries, { id: uid(), label: 'PCC plant export', direction: 'EXPORT', origin: 'FOSSIL', quantityTonnes: null }])
  return (
    <div className="form-card">
      <h2>CO2 imports / exports (PCC plants, neutralization)</h2>
      <p className="form-sub">Fossil CO2 exported from the lime kiln to an adjacent PCC plant is NOT emitted by the mill and is subtracted from gross. Biogenic transfers adjust the memo line, not gross.</p>
      {entries.length === 0 ? (
        <ActivityEmptyState title="No transfers yet" hint="Add CO2 imports or exports from PCC plants or neutralization." onAdd={add} addLabel="Add transfer" />
      ) : null}
      {entries.map((e, i) => (
        <EntryShell key={e.id} index={i} title={e.label || '(unnamed transfer)'} badge={<span className="entry-badge entry-badge-mixed">{e.direction === 'EXPORT' ? 'deduction' : 'addition'}</span>} co2={traceOut(trace, `CO2 transfer (${e.direction.toLowerCase()}, ${e.origin.toLowerCase()}) - ${e.label}`)}
          onRemove={() => onChange(entries.filter((x) => x.id !== e.id))}
          evidenceReference={e.evidenceReference} notes={e.overrideReason}
          onEvidenceChange={(patch) => upd(e.id, (x) => Object.assign(x, patch))}
          formula={<>Net E_CO2 = combustion − exports + imports (fossil); biogenic transfers adjust memo line.</>}>
          <div className="entry-card-section">
            <div className="field-row">
              <EntryLabelField value={e.label} onChange={(v) => upd(e.id, (f) => (f.label = v))} suggestions={labelSuggestionsFor('pulp_paper', 'combustion')} />
              <EntryLabeledSelect
                label="Direction"
                value={e.direction}
                onChange={(v) => upd(e.id, (f) => (f.direction = v as Co2TransferEntry['direction']))}
                options={[
                  { value: 'EXPORT', label: 'Export (deduction)' },
                  { value: 'IMPORT', label: 'Import (addition)' },
                ]}
              />
              <EntryLabeledSelect
                label="Origin"
                value={e.origin}
                onChange={(v) => upd(e.id, (f) => (f.origin = v as Co2TransferEntry['origin']))}
                options={[
                  { value: 'FOSSIL', label: 'Fossil (affects Scope 1)' },
                  { value: 'BIOGENIC', label: 'Biogenic (affects memo)' },
                ]}
              />
              <NumField label="Quantity" unit="tCO2" value={e.quantityTonnes} onChange={(v) => upd(e.id, (f) => (f.quantityTonnes = v))} />
            </div>
          </div>
        </EntryShell>
      ))}
      <button className="add-entry-btn" onClick={add}><Plus size={15} /> Add transfer</button>
    </div>
  )
}

function ReportedTable({ entries, trace, onChange }: { entries: ReportedEntry[]; trace: TraceEntry[] | undefined; onChange: (rows: ReportedEntry[]) => void }) {
  const upd = (id: string, mut: (f: ReportedEntry) => void) => onChange(entries.map((e) => e.id === id ? (() => { const c = { ...e }; mut(c); return c })() : e))
  const add = () => onChange([...entries, { id: uid(), label: 'Disclosed source', basis: 'REPORTED' }])
  return (
    <div className="form-card">
      <h2>Reported / direct emissions</h2>
      <p className="form-sub">For public-disclosure or head-office data: enter disclosed CO2e (or by-gas masses) directly when activity inputs aren&apos;t available. These sit in their own bucket — never mixed with modelled bottom-up sources.</p>
      {entries.length === 0 ? (
        <ActivityEmptyState title="No reported figures yet" hint="Add disclosed CO2e totals for reconciliation." onAdd={add} addLabel="Add reported figure" />
      ) : null}
      {entries.map((e, i) => (
        <EntryShell key={e.id} index={i} title={e.label || '(unnamed)'} badge={S1_BADGE} co2={traceOut(trace, `Reported / direct - ${e.label}`)}
          onRemove={() => onChange(entries.filter((x) => x.id !== e.id))}
          formula={<>direct disclosed CO2e, or CO2 + CH4·GWP + N2O·GWP from reported gas masses</>}>
          <div className="entry-card-section">
            <div className="field-row">
              <EntryLabelField value={e.label} onChange={(v) => upd(e.id, (r) => (r.label = v))} suggestions={labelSuggestionsFor('pulp_paper', 'fugitive')} />
              <label className="field">Source / category tag<input value={e.categoryTag ?? ''} placeholder="e.g. corporate disclosure" onChange={(ev) => upd(e.id, (r) => (r.categoryTag = ev.target.value))} /></label>
              <EntryLabeledSelect
                label="Basis"
                value={e.basis}
                onChange={(v) => upd(e.id, (r) => (r.basis = v as ReportedEntry['basis']))}
                options={(['MEASURED', 'ESTIMATED', 'INFERRED', 'REPORTED', 'RESIDUAL'] as const).map((b) => ({
                  value: b,
                  label: b.toLowerCase(),
                }))}
              />
            </div>
            <div className="field-row">
              <NumField label="Total CO2e" unit="tCO2e" value={e.co2eTonnes ?? null} onChange={(v) => upd(e.id, (r) => (r.co2eTonnes = v))} hint="authoritative if set" />
              <NumField label="…or CO2" unit="t" value={e.co2Tonnes ?? null} onChange={(v) => upd(e.id, (r) => (r.co2Tonnes = v))} />
              <NumField label="CH4" unit="t" value={e.ch4Tonnes ?? null} onChange={(v) => upd(e.id, (r) => (r.ch4Tonnes = v))} />
              <NumField label="N2O" unit="t" value={e.n2oTonnes ?? null} onChange={(v) => upd(e.id, (r) => (r.n2oTonnes = v))} />
            </div>
            <div className="field-row">
              <label className="field" style={{ gridColumn: 'span 2' }}>Source / disclosure reference<input value={e.source ?? ''} placeholder="e.g. Sustainability Report 2025 p.42 / URL" onChange={(ev) => upd(e.id, (r) => (r.source = ev.target.value))} /></label>
              <label className="field" style={{ gridColumn: 'span 2' }}>Note / assumption<input value={e.note ?? ''} placeholder="mapping assumption, exclusions, etc." onChange={(ev) => upd(e.id, (r) => (r.note = ev.target.value))} /></label>
            </div>
          </div>
        </EntryShell>
      ))}
      <button className="add-entry-btn" onClick={add}><Plus size={15} /> Add reported figure</button>
    </div>
  )
}

/* ----------------------------- live totals ----------------------------- */

function PulpLiveTotals({ live }: { live: PulpPaperCalculationResult | null }) {
  if (!live) return null
  const s = live.scope1
  const detailItems = Object.entries(s.byCategory).map(([k, g]) => ({
    label: categoryLabel(k),
    value: g.co2eTonnes,
    unit: 'tCO2e',
  }))
  return (
    <LiveTotalsStrip
      headlineItems={[
        { label: 'Gross Scope 1', value: s.grossScope1CO2eTonnes, unit: 'tCO2e' },
        { label: 'CO2', value: s.byGas.co2Tonnes, unit: 'tCO2' },
        { label: 'CH4 (as CO2e)', value: s.byGas.ch4CO2eTonnes, unit: 'tCO2e' },
        { label: 'N2O (as CO2e)', value: s.byGas.n2oCO2eTonnes, unit: 'tCO2e' },
      ]}
      detailItems={[
        ...detailItems,
        { label: 'Refrigerants', value: s.byGas.refrigerantCO2eTonnes, unit: 'tCO2e' },
        { label: 'Biogenic memo', value: live.memoItems.biogenicCO2Tonnes, unit: 'tCO2' },
      ]}
    />
  )
}

/* ------------------------------ Step 5 report ----------------------------- */

function PulpPaperResultsPage({
  result,
  payload,
  busy,
  onBack,
  onSave,
  onLock,
  locked,
  onDownload,
  onSignoffPatch,
  versions,
  onRestore,
}: {
  result: PulpPaperCalculationResult
  payload: PulpPaperInputPayload
  busy: boolean
  onBack: () => void
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
  const auditCount = result.factorSnapshots.length + result.calculationTrace.length
  const driverGroups = driverGroupsFromCategories(result.scope1.byCategory)
  const byGas = {
    co2Tonnes: result.scope1.byGas.co2Tonnes,
    ch4Tonnes: result.scope1.byGas.ch4Tonnes,
    n2oTonnes: result.scope1.byGas.n2oTonnes,
    co2eTonnes: result.scope1.grossScope1CO2eTonnes,
  }
  const hasProduction =
    (payload.activityData.production.airDryPulpTonnes ?? 0) > 0 ||
    (payload.activityData.production.paperProducedTonnes ?? 0) > 0 ||
    (payload.activityData.production.boardProducedTonnes ?? 0) > 0

  return (
    <section className="step-page active results-page">
      <h1 className="step-title">
        Scope 1 <em>report</em>
      </h1>
      <p className="step-sub">
        {result.methodologyPack} | GWP {result.gwpSet.replace(/_/g, ' ')} | {payload.organization.name} |{' '}
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
        currentGross={result.scope1.grossScope1CO2eTonnes}
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
            <span>Gross Scope 1 (CO2 + CH4 + N2O + HFCs)</span>
            <strong>{fmt(result.scope1.grossScope1CO2eTonnes)}</strong>
            <small>tCO2e</small>
            <p style={{ marginTop: 10 }}>
              CO2 {fmt(result.scope1.byGas.co2Tonnes)} t | CH4 {fmt(result.scope1.byGas.ch4Tonnes)} t (
              {fmt(result.scope1.byGas.ch4CO2eTonnes)} tCO2e) | N2O {fmt(result.scope1.byGas.n2oTonnes)} t |
              refrigerants {fmt(result.scope1.byGas.refrigerantCO2eTonnes)} tCO2e
            </p>
          </div>

          {driverGroups.length > 0 && (
            <div className="form-card">
              <h2>Emissions drivers</h2>
              <p className="form-sub">Share of gross Scope 1 by emission category.</p>
              <EmissionsDriverChart gross={result.scope1.grossScope1CO2eTonnes} groups={driverGroups} />
            </div>
          )}

          <div className="summary-cats summary-cats-compact">
            <div className="summary-card">
              <span>Biogenic CO2 memo</span>
              <strong>{fmt(result.memoItems.biogenicCO2Tonnes)}</strong>
              <small>tCO2 (excluded)</small>
            </div>
            <div className="summary-card">
              <span>Supporting Scope 2</span>
              <strong>{fmt(result.supportingScope2.purchasedElectricityCO2eTonnes)}</strong>
              <small>tCO2e (electricity)</small>
            </div>
            <div className="summary-card">
              <span>Supporting Scope 3</span>
              <strong>{fmt(result.supportingScope3.thirdPartyMobileCO2eTonnes)}</strong>
              <small>tCO2e (third-party mobile)</small>
            </div>
          </div>

          {result.reconciliation.checked ? (
            <ReconciliationPanel note={result.reconciliation.note} lines={result.reconciliation.lines} />
          ) : null}

          {hasProduction ? (
            <div className="form-card">
              <h2>Production and intensity</h2>
              <p className="form-sub">Reporting-period production volumes and derived emission intensities.</p>
              <div className="summary-cats">
                {(payload.activityData.production.airDryPulpTonnes ?? 0) > 0 && (
                  <div className="summary-card">
                    <span>Air-dry pulp produced</span>
                    <strong>{fmt(payload.activityData.production.airDryPulpTonnes ?? 0)}</strong>
                    <small>ADt</small>
                  </div>
                )}
                {(payload.activityData.production.paperProducedTonnes ?? 0) > 0 && (
                  <div className="summary-card">
                    <span>Paper produced</span>
                    <strong>{fmt(payload.activityData.production.paperProducedTonnes ?? 0)}</strong>
                    <small>t</small>
                  </div>
                )}
                {(payload.activityData.production.boardProducedTonnes ?? 0) > 0 && (
                  <div className="summary-card">
                    <span>Board produced</span>
                    <strong>{fmt(payload.activityData.production.boardProducedTonnes ?? 0)}</strong>
                    <small>t</small>
                  </div>
                )}
                {result.intensityMetrics.co2ePerAdtPulp != null && (
                  <div className="summary-card">
                    <span>Intensity per ADt pulp</span>
                    <strong>{fmt(result.intensityMetrics.co2ePerAdtPulp)}</strong>
                    <small>kgCO2e / ADt</small>
                  </div>
                )}
                {result.intensityMetrics.co2ePerTonnePaper != null && (
                  <div className="summary-card">
                    <span>Intensity per t paper</span>
                    <strong>{fmt(result.intensityMetrics.co2ePerTonnePaper)}</strong>
                    <small>kgCO2e / t</small>
                  </div>
                )}
                {result.intensityMetrics.co2ePerTonneBoard != null && (
                  <div className="summary-card">
                    <span>Intensity per t board</span>
                    <strong>{fmt(result.intensityMetrics.co2ePerTonneBoard)}</strong>
                    <small>kgCO2e / t</small>
                  </div>
                )}
                {result.intensityMetrics.fossilCo2PerAdtPulp != null && (
                  <div className="summary-card">
                    <span>Fossil CO2 / ADt pulp</span>
                    <strong>{fmt(result.intensityMetrics.fossilCo2PerAdtPulp)}</strong>
                    <small>kgCO2 / ADt</small>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="form-card">
              <h2>Production and intensity</h2>
              <p className="form-sub">
                No production volumes entered. Add volumes on Step 4 under Production to enable intensity metrics.
              </p>
            </div>
          )}

          {result.errors.length > 0 && (
            <div className="form-card" style={{ borderColor: '#c2410c' }}>
              <h2>
                <AlertCircle size={18} /> Validation errors
              </h2>
              {result.errors.map((e, i) => (
                <p key={i} className="form-sub text-error">
                  <b>{e.code}</b> - {e.message}
                </p>
              ))}
            </div>
          )}
          {result.warnings.length > 0 && (
            <div className="form-card">
              <h2>
                <Info size={18} /> Warnings
              </h2>
              {result.warnings.map((w, i) => (
                <p key={i} className="form-sub text-warn">
                  <b>{w.code}</b> - {w.message}
                </p>
              ))}
            </div>
          )}
          {result.errors.length === 0 && result.warnings.length === 0 && (
            <div className="form-card">
              <h2>
                <CheckCircle2 size={18} /> Clean run
              </h2>
              <p className="form-sub">No validation issues raised.</p>
            </div>
          )}
        </>
      )}

      {tab === 'breakdown' && (
        <>
          <CategorySummaryCards byCategory={result.scope1.byCategory} />
          <ByCategoryGasTable
            byCategory={result.scope1.byCategory}
            byGas={byGas}
            grossCO2e={result.scope1.grossScope1CO2eTonnes}
            colGrid={COL_GRID}
          />
        </>
      )}

      {tab === 'audit' && (
        <>
          {result.assumptions.length > 0 && (
            <div className="form-card">
              <h2>Assumptions and limitations</h2>
              {result.assumptions.map((a, i) => (
                <p key={i} className="form-sub" style={{ margin: '4px 0' }}>
                  <span className="entry-badge" style={{ marginRight: 8 }}>
                    {a.kind.toLowerCase()}
                  </span>
                  <b>{a.label}</b> - {a.detail}
                </p>
              ))}
            </div>
          )}
          <FactorSnapshotsPanel snapshots={result.factorSnapshots} />
          <CalculationTracePanel trace={result.calculationTrace} />
        </>
      )}

      <div className="step-footer">
        <button type="button" className="btn ghost" onClick={onBack}>
          Back
        </button>
      </div>
    </section>
  )
}

/* ----------------------------- main wizard ----------------------------- */


export function PulpPaperWizard({ onSwitchSector }: { onSwitchSector?: (s: 'cement' | 'oil_gas' | 'pulp_paper' | 'iron_steel' | 'power') => void }) {
  const dialog = useAppDialog()
  const [p, setP] = useState<PulpPaperInputPayload>(emptyPulpPaperPayload)
  const [step, setStep] = useState<number>(1)
  const [cat, setCat] = useState<Cat>('stationary')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<PulpPaperCalculationResult | null>(null)
  const [live, setLive] = useState<PulpPaperCalculationResult | null>(null)
  const { theme, toggleTheme } = useWizardTheme()
  const [importError, setImportError] = useState<string | null>(null)
  const [hasDraft, setHasDraft] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [step3Tried, setStep3Tried] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [factors, setFactors] = useState<{
    constants: { factorCode: string; factorName: string; value: number; unit: string; source: string }[]
  } | null>(null)

  useEffect(() => {
    scope1Fetch('/api/v1/factors?sector=pulp_paper')
      .then((r) => r.json())
      .then(setFactors)
      .catch(() => {})
  }, [])

  // restore draft (theme stays at the explicit user choice; do NOT auto-flip to OS dark mode)
  useEffect(() => {
    try {
      const restored = loadDraft()
      if (restored && draftIsMeaningful(restored)) { setP(restored); setHasDraft(true) }
    } catch { /* ignore */ }
  }, [])

  // Don't show "required" errors on a fresh return to step 2/3 — only after the
  // user has actually clicked Continue on that step within the current visit.
  useEffect(() => {
    if (step === 1) { setStep3Tried(false) }
  }, [step])

  // If user toggles the currently-open category OFF, snap to Production (always visible)
  useEffect(() => {
    const meta = CATEGORIES.find((c) => c.key === cat)
    if (meta?.appKey && p.sourceApplicability[meta.appKey] === false) {
      setCat('production')
    }
  }, [cat, p.sourceApplicability])

  // Auto-derive source applicability defaults from the selected mill type
  // (paper-only mills don't have recovery furnaces, lime kilns, biomass etc.).
  // User can still override each flag on Step 4. We only refresh when mill type
  // actually changes — don't clobber a hand-edited applicability set otherwise.
  const prevMillTypeRef = useRef<string | null>(null)
  useEffect(() => {
    const mt = p.facility.millType
    if (mt && mt !== prevMillTypeRef.current) {
      const defaults = MILL_APPLICABILITY_DEFAULTS[mt]
      if (defaults && prevMillTypeRef.current !== null) {
        // Only auto-update when user changes mill type after initial load,
        // not on hydration of an existing draft.
        patch((d) => (d.sourceApplicability = { ...defaults }))
      }
      prevMillTypeRef.current = mt
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.facility.millType])

  // autosave + debounced live calc
  useEffect(() => {
    saveDraft(p)
    const id = setTimeout(() => {
      try { setLive(calculatePulpPaper(p)) } catch { setLive(null) }
    }, 250)
    return () => clearTimeout(id)
  }, [p])

  function patch(mut: (d: PulpPaperInputPayload) => void) {
    setP((prev) => { const draft = JSON.parse(JSON.stringify(prev)) as PulpPaperInputPayload; mut(draft); return draft })
  }

  useScope1OrganizationPrefill(patch)
  useScope1BoundaryPrefill(patch)

  function startFresh() {
    try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
    setP(emptyPulpPaperPayload()); setStep(1); setResult(null); setHasDraft(false)
  }

  function commitResult(res: PulpPaperCalculationResult) {
    setResult(res)
    saveInventoryVersion('pulp_paper', {
      label: `FY ${res.reportingPeriod.year} calculate`,
      grossScope1: res.scope1.grossScope1CO2eTonnes,
      status: res.status,
      payload: p,
    })
    setStep(4)
  }

  async function loadSample() {
    const sample = sampleKraftMill()
    setP(sample)
    saveDraft(sample)
    setHasDraft(true)
    setBusy(true)
    try {
      const r = await scope1Fetch('/api/v1/calculations/pulp-paper/calculate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sample),
      })
      const data = await r.json()
      commitResult(data.result as PulpPaperCalculationResult)
    } finally { setBusy(false) }
  }

  function navigateToField(fieldPath: string) {
    const category = activityCategoryFromFieldPath('pulp_paper', fieldPath)
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
      const data = await uploadActivityExcel('pulp_paper', file)
      patch((d) => {
        d.activityData = mergeImportedActivity(d.activityData, data.activityData)
      })
      setImportError(
        data.imported === 0
          ? 'No rows imported. Check category column (stationary, biomass, mobile, etc.).'
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
      if (category === 'stationary' && ad.stationaryCombustion.length === 0) {
        ad.stationaryCombustion.push({
          id: uid(),
          label: 'Power boiler',
          fuelCode: 'natural_gas',
          technology: 'BOILER_OR_IR_DRYER',
          quantity: null,
          quantityUnit: 'Sm3',
        })
      }
      if (category === 'mobile' && ad.mobile.length === 0) {
        ad.mobile.push({
          id: uid(),
          label: 'Yard truck',
          ownership: 'OWNED_CONTROLLED',
          vehicleCode: 'DIESEL_OFFROAD',
          quantity: null,
          quantityUnit: 'L',
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
        if (payload?.sector?.sectorCode !== 'PULP_PAPER') { setImportError('That file is not a P&P payload (expected sector PULP_PAPER).'); return }
        if (!payload.activityData || !payload.calculationContext) { setImportError('That file does not look like a calculator payload.'); return }
        const base = emptyPulpPaperPayload()
        const merged: PulpPaperInputPayload = {
          ...base, ...payload,
          calculationContext: { ...base.calculationContext, ...payload.calculationContext },
          organization: { ...base.organization, ...payload.organization },
          facility: { ...base.facility, ...payload.facility },
          organizationBoundary: { ...base.organizationBoundary, ...payload.organizationBoundary },
          methodSelections: { ...base.methodSelections, ...payload.methodSelections },
          sourceApplicability: { ...base.sourceApplicability, ...payload.sourceApplicability },
          activityData: { ...base.activityData, ...payload.activityData },
        }
        setImportError(null); setP(merged); saveDraft(merged); setHasDraft(true); setResult(null); setLive(null); setStep(3)
      } catch { setImportError('Could not parse that file as JSON.') }
    }
    reader.readAsText(file)
  }

  async function runCalculate(save: boolean) {
    setBusy(true)
    try {
      const r = await scope1Fetch(`/api/v1/calculations/pulp-paper/calculate${save ? scope1SaveQuery(true) : ''}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p),
      })
      const data = await r.json()
      const result = data.result as PulpPaperCalculationResult
      // Surface the persisted calculationId on the result so Step 5 can show it.
      if (data.calculationId && result) result.calculationId = data.calculationId
      commitResult(result)
    } finally { setBusy(false) }
  }

  async function lockInventory() {
    setSubmitError(null)
    setBusy(true)
    try {
      const out = await submitScope1ForReview(
        '/api/v1/calculations/pulp-paper/calculate',
        p,
        p.organization.contactName || 'system',
      )
      if (!out.ok) {
        setSubmitError(out.message)
        return
      }
      setSubmitted(true)
    } finally {
      setBusy(false)
    }
  }

  async function download(format: 'json' | 'xlsx' | 'pdf' | 'csv' | 'audit-pack') {
    const r = await scope1Fetch('/api/v1/calculations/pulp-paper/export', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: p, format }),
    })
    const blob = await r.blob()
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    const ext = format === 'audit-pack' ? 'zip' : format
    const suffix = format === 'audit-pack' ? '-audit-pack' : ''
    a.download = `scope1-pulppaper-${p.facility.name || 'mill'}-FY${p.calculationContext.reportingPeriod.year}${suffix}.${ext}`
    document.body.appendChild(a); a.click(); a.remove()
  }

  const ad = p.activityData
  const ms = p.methodSelections

  const counts = {
    production: Object.values(ad.production).filter((v) => v != null).length,
    stationary: ad.stationaryCombustion.length,
    biomass: ad.biomassCombustion.length,
    limeKiln: ad.limeKilns.length,
    makeup: ad.makeupCarbonates.length,
    mobile: ad.mobile.length,
    landfill: ad.landfills.length,
    wwt: ad.anaerobicWwt.length,
    refrigerant: ad.refrigerants.length,
    chp: ad.chpAllocation.length,
    transfer: ad.co2Transfers.length,
    reported: ad.reported.length,
  } as const

  const orgValid = !!p.organization.name.trim()
  const facilityValid = !!p.facility.name.trim() && !!p.facility.millType
  const sourcesValid = useMemo(
    () =>
      sourceApplicabilityComplete(
        PULP_PAPER_INVENTORY_SOURCES,
        applicabilityFlags(p.sourceApplicability),
        p.sourceApplicability.exclusionReasons,
      ),
    [p.sourceApplicability],
  )

  // Validation gates on the step-progress nav: clicking a forward step that
  // isn't yet reachable redirects back to the first incomplete step and
  // surfaces inline field errors (step2Tried / step3Tried).
  const canReach = (target: number): boolean => {
    if (target <= 1) return true
    if (target === 2) return orgValid
    if (target === 3) return orgValid && facilityValid
    if (target === 4) return orgValid && facilityValid && !!result
    return false
  }
  function tryGoTo(target: number) {
    if (target === step) return
    if (target < step) return setStep(target)
    if (target > 1 && !orgValid) return setStep(1)
    if (target > 2 && !facilityValid) { setStep3Tried(true); return setStep(2) }
    if (target === 4 && !result) return setStep(3)
    setStep(target)
  }

  const trace = (live?.calculationTrace ?? result?.calculationTrace) as TraceEntry[] | undefined

  return (
    <main className={theme === 'dark' ? 'wizard-app dark' : 'wizard-app'}>
      <WizardStickyChrome>
        <header className="wizard-header">
          <div className="wizard-header-inner">
            <button className="wizard-brand" onClick={() => setStep(1)} title="Calculator home" aria-label="Back to calculator home">
              <img className="brand-logo" src={theme === 'dark' ? '/brand/typemark-white.svg' : '/brand/typemark-black.svg'} alt="Sustally" />
              <span className="brand-divider" />
              <span className="brand-label">
                <span className="brand-eyebrow">Scope 1 Calculator</span>
                <span className="brand-product">Pulp &amp; Paper</span>
              </span>
            </button>
            <div className="wizard-actions">
              <button className="theme-switch" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
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
            facilityLockHint: 'Add mill name and mill type on Facility & methods first.',
          }}
        />
      </WizardStickyChrome>

      <section className="wizard-main">
        {step === 1 && (
          <section className="step-page active sector-step-page">
            <div className="sector-step-intro">
              <h1 className="step-title">What sector are you <em>in?</em></h1>
              <p className="step-sub">Pulp &amp; Paper uses the ICFPA/NCASI v1.4 ten-category taxonomy. Gross Scope 1 covers all four canonical source types — <b>stationary combustion</b> (fossil + biomass), <b>mobile combustion</b>, <b>process emissions</b> (lime kiln + make-up carbonates), and <b>fugitive emissions</b> (landfill CH4, anaerobic WWT, refrigerants) — as full CO2e. Biogenic CO2 is a separate memo line.</p>
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
              {importError && <p className="field-error" style={{ marginTop: 12 }}>{importError}</p>}
            </div>
            <div className="sector-step-body">
              <div className="sector-step-grid-wrap">
                <div className="sector-grid">
              <button className="sector-card" onClick={() => onSwitchSector?.('cement')}>
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
              <button className="sector-card selected">
                <span className="icon"><TreePine size={22} strokeWidth={1.75} /></span>
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
              {['Chemicals','Textile','Pharma','General Mfg'].map((x) => (
                <button className="sector-card muted" key={x} disabled>
                  <span className="icon"><Hexagon size={22} strokeWidth={1.75} /></span>
                  <strong>{x}</strong>
                  <small>Future sector pack</small>
                  <span className="tags">Planned</span>
                </button>
              ))}
              <GwpSectorCards
                value={p.calculationContext.gwpSet}
                options={GWP_OPTIONS_THREE}
                beforeChange={async () => {
                  if (!(step >= 3 || result || live)) return true
                  return dialog.confirm(
                    'Changing the GWP set recalculates all CO2e values. Continue?',
                    'Change GWP set',
                  )
                }}
                onChange={(g) => patch((d) => (d.calculationContext.gwpSet = g as typeof d.calculationContext.gwpSet))}
              />
                </div>
              </div>
              <aside className="sector-step-onboarding-col" aria-label="Get started">
                <div className="callout callout-info sector-step-onboarding">
                  <div>
                    <b>First time here?</b>{' '}
                    <span>See the calculator end-to-end with a sample kraft mill.</span>
                  </div>
                  <div className="sector-step-onboarding-actions">
                    <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.currentTarget.value = '' }} />
                    <button type="button" className="btn ghost" onClick={() => fileRef.current?.click()}>Load JSON</button>
                    <button type="button" className="add-entry-btn" onClick={loadSample} disabled={busy}>{busy ? 'Loading…' : 'Try with sample data →'}</button>
                  </div>
                </div>
              </aside>
            </div>
            <div className="sector-step-footer">
              <button className="btn primary" onClick={() => setStep(2)}>Continue</button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="step-page active">
            <h1 className="step-title">Mill &amp; <em>methods</em></h1>
            <p className="step-sub">Mill type drives which categories are applicable (kraft → lime kilns + makeup carbonates).</p>
            <div className="form-card">
              <h2>Facility</h2>
              <div className="field-row">
                <AccessibleTextField
                  label="Mill name"
                  required
                  value={p.facility.name}
                  placeholder="e.g. Karnataka Kraft Mill"
                  error={step3Tried && !p.facility.name.trim() ? 'Mill name is required.' : undefined}
                  onChange={(v) => patch((d) => (d.facility.name = v))}
                />
                <AccessibleSelect
                  label="Mill type"
                  value={p.facility.millType}
                  onChange={(v) =>
                    patch((d) => (d.facility.millType = v as PulpPaperInputPayload['facility']['millType']))
                  }
                  options={[
                    { value: 'KRAFT', label: 'Kraft (chemical pulp)' },
                    { value: 'SULFITE', label: 'Sulfite (chemical pulp)' },
                    { value: 'RECYCLED', label: 'Recycled fibre / deinking' },
                    { value: 'MECHANICAL', label: 'Mechanical / TMP' },
                    { value: 'PAPER_ONLY', label: 'Paper-only (non-integrated)' },
                    { value: 'INTEGRATED', label: 'Integrated (pulp + paper)' },
                    { value: 'MIXED', label: 'Mixed / portfolio aggregate' },
                  ]}
                />
                <NumField label="Reporting year" step="1" value={p.calculationContext.reportingPeriod.year}
                  onChange={(v) => patch((d) => { const y = v ?? 2026; d.calculationContext.reportingPeriod = { year: y, startDate: `${y}-01-01`, endDate: `${y}-12-31` } })} />
              </div>
            </div>
            <PulpPaperMethodologyGuide
              methodSelections={ms}
              onPatchMethods={(mut) => patch((d) => mut(d.methodSelections))}
            />
            <SourceApplicabilityPanel
              sources={PULP_PAPER_INVENTORY_SOURCES}
              flags={applicabilityFlags(p.sourceApplicability)}
              reasons={p.sourceApplicability.exclusionReasons}
              fieldErrors={
                step3Tried && !sourcesValid
                  ? Object.fromEntries(
                      PULP_PAPER_INVENTORY_SOURCES.filter((s) => p.sourceApplicability[s.key as keyof typeof p.sourceApplicability] === false)
                        .filter((s) => !(p.sourceApplicability.exclusionReasons?.[s.key] ?? '').trim())
                        .map((s) => [s.key, 'Exclusion reason is required for audit.']),
                    )
                  : undefined
              }
              onChange={(key, included, reason) =>
                patch((d) => {
                  d.sourceApplicability = updateSourceApplicability(d.sourceApplicability, key, included, reason)
                })
              }
            />
            <div className="step-footer">
              <button className="btn ghost" onClick={() => setStep(1)}>Back</button>
              <button className="btn primary" onClick={() => { setStep3Tried(true); if (facilityValid && sourcesValid) setStep(3) }}>Continue</button>
            </div>
            {step3Tried && (!facilityValid || !sourcesValid) && (
              <p className="field-error" style={{ marginTop: 6 }}>
                Mill name, mill type, and exclusion reasons for any sources marked out of scope are required.
              </p>
            )}
          </section>
        )}

        {step === 3 && (
          <ActivityDataShell
            categories={CATEGORIES.filter(c => !c.appKey || p.sourceApplicability[c.appKey] !== false).map(({ key, label, icon }) => ({
              key,
              label,
              icon,
              hint: PULP_ACTIVITY_HINTS[key],
              count: counts[key],
            }))}
            activeKey={cat}
            onCategoryChange={(k) => setCat(k as Cat)}
            liveTotals={<PulpLiveTotals live={live} />}
            methodology={{
              profileTitle: profileTitle(PULP_PAPER_PROFILES, detectPulpPaperProfile(ms)),
              summaryLines: pulpPaperMethodSummary(ms).slice(0, 2),
              onEditMethods: () => setStep(2),
            }}
            tools={
              <ActivityDataTools
                sector="pulp_paper"
                onImportJson={importActivityJson}
                onImportExcel={importActivityExcel}
                onFillSampleRow={() => fillSampleRowForCategory(cat)}
              />
            }
            onFieldNavigate={navigateToField}
            validation={live ? { errors: live.errors, warnings: live.warnings } : undefined}
            advanced={
              <FactorOverridePanel
                factors={factors?.constants ?? []}
                overrides={p.factorOverrides}
                onChange={(o) => patch((d) => (d.factorOverrides = o))}
                standardsNote="ICFPA/NCASI v1.4, IPCC 2006, and AR5/AR6 GWPs."
              />
            }
            footer={
              <div className="step-footer">
                <button type="button" className="btn ghost" onClick={() => setStep(2)}>
                  Back
                </button>
                <button type="button" className="btn primary" onClick={() => runCalculate(false)} disabled={busy}>
                  {busy ? 'Calculating…' : 'Calculate Scope 1'}
                </button>
              </div>
            }
          >
              {cat === 'production' && (
                <div className="form-card">
                  <h2>Production volumes</h2>
                  <p className="form-sub">Reporting-period volumes drive intensity metrics (kgCO2e/ADt pulp, t paper, t board).</p>
                  <div className="field-row">
                    <NumField label="Air-dry pulp (ADt)" unit="t" value={ad.production.airDryPulpTonnes ?? null} onChange={(v) => patch((d) => (d.activityData.production.airDryPulpTonnes = v))} />
                    <NumField label="Paper produced" unit="t" value={ad.production.paperProducedTonnes ?? null} onChange={(v) => patch((d) => (d.activityData.production.paperProducedTonnes = v))} />
                    <NumField label="Board produced" unit="t" value={ad.production.boardProducedTonnes ?? null} onChange={(v) => patch((d) => (d.activityData.production.boardProducedTonnes = v))} />
                  </div>
                </div>
              )}
              {cat === 'stationary' && <StationaryTable entries={ad.stationaryCombustion} trace={trace} onChange={(rows) => patch((d) => (d.activityData.stationaryCombustion = rows))} />}
              {cat === 'biomass' && <BiomassTable entries={ad.biomassCombustion} trace={trace} onChange={(rows) => patch((d) => (d.activityData.biomassCombustion = rows))} />}
              {cat === 'limeKiln' && <LimeKilnTable entries={ad.limeKilns} trace={trace} onChange={(rows) => patch((d) => (d.activityData.limeKilns = rows))} />}
              {cat === 'makeup' && <MakeupTable entries={ad.makeupCarbonates} trace={trace} onChange={(rows) => patch((d) => (d.activityData.makeupCarbonates = rows))} />}
              {cat === 'mobile' && <MobileTable entries={ad.mobile} trace={trace} onChange={(rows) => patch((d) => (d.activityData.mobile = rows))} />}
              {cat === 'landfill' && <LandfillTable entries={ad.landfills} trace={trace} onChange={(rows) => patch((d) => (d.activityData.landfills = rows))} />}
              {cat === 'wwt' && <WwtTable entries={ad.anaerobicWwt} trace={trace} onChange={(rows) => patch((d) => (d.activityData.anaerobicWwt = rows))} />}
              {cat === 'refrigerant' && <RefrigerantTable entries={ad.refrigerants} trace={trace} onChange={(rows) => patch((d) => (d.activityData.refrigerants = rows))} />}
              {cat === 'chp' && <ChpTable entries={ad.chpAllocation} trace={trace} onChange={(rows) => patch((d) => (d.activityData.chpAllocation = rows))} />}
              {cat === 'transfer' && <TransferTable entries={ad.co2Transfers} trace={trace} onChange={(rows) => patch((d) => (d.activityData.co2Transfers = rows))} />}
              {cat === 'reported' && (
                <>
                  <ReportedTable entries={ad.reported} trace={trace} onChange={(rows) => patch((d) => (d.activityData.reported = rows))} />
                  <div className="form-card">
                    <h2>Reconciliation against a disclosed total</h2>
                    <p className="form-sub">Optional. If you have a published gross Scope 1 figure, enter it here. We flag a variance &gt;5%.</p>
                    <div className="field-row">
                      <NumField label="Disclosed gross Scope 1" unit="tCO2e" value={ad.disclosedGrossScope1CO2eTonnes ?? null} onChange={(v) => patch((d) => (d.activityData.disclosedGrossScope1CO2eTonnes = v))} hint="from public disclosure" />
                    </div>
                  </div>
                </>
              )}
          </ActivityDataShell>
        )}

        {step === 4 && result && (
          submitted ? (
            <Scope1ReviewSubmittedContent sectorLabel="Scope 1 · Pulp & Paper" />
          ) : (
            <Scope1ReviewContent
              quadrants={buildScope1ReviewQuadrants(
                p as unknown as Record<string, unknown>,
                result as unknown as Record<string, unknown>,
                'PULP_PAPER',
              )}
              busy={busy}
              onBack={() => setStep(3)}
              onSubmit={lockInventory}
              submitError={submitError}
            />
          )
        )}

      </section>
    </main>
  )
}
