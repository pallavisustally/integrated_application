'use client'

import { useAppDialog } from '@/components/app-dialog-provider'
import { scope1Api } from '@/lib/scope1-api'
import type { ComponentType, ReactNode } from 'react'
import { useMemo, useState } from 'react'

/** Sticky top chrome: logo row + progress stepper stay visible while scrolling. */
export function WizardStickyChrome({ children }: { children: ReactNode }) {
  return <div className="wizard-sticky-chrome">{children}</div>
}

import type { FactorSnapshot, TraceEntry } from '@/lib/engine/types'
import { categoryLabel, cementComponentLabel } from '@/lib/ui/labels'
import { EmissionsDriverRecharts } from '@/components/emissions-driver-recharts'
import { formatNumber } from '@/lib/ui/locale'
import { scrollToFieldPath } from '@/lib/ui/field-navigation'
import { compareGrossDelta, listInventoryVersions, type InventoryVersionSnapshot } from '@/lib/ui/version-history'
import { hasSignoffContact, type ReportSignoffInput } from '@/lib/report/signoff'

export type GasAmountsRow = {
  co2Tonnes: number
  ch4Tonnes: number
  n2oTonnes: number
  co2eTonnes: number
}

const fmt = (v: number) => formatNumber(v, 2)
const fmt4 = (v: number) => formatNumber(v, 4)

export type ResultsTab = 'summary' | 'breakdown' | 'audit'

export function ResultsViewTabs({
  tab,
  onChange,
  auditCount,
}: {
  tab: ResultsTab
  onChange: (t: ResultsTab) => void
  auditCount: number
}) {
  const items: { id: ResultsTab; label: string; hint?: string }[] = [
    { id: 'summary', label: 'Summary' },
    { id: 'breakdown', label: 'Breakdown' },
    { id: 'audit', label: 'Audit trail', hint: String(auditCount) },
  ]
  return (
    <div className="results-view-tabs" role="tablist" aria-label="Report sections">
      {items.map(({ id, label, hint }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={tab === id}
          className={tab === id ? 'active' : ''}
          onClick={() => onChange(id)}
        >
          {label}
          {hint ? <span className="results-tab-count">{hint}</span> : null}
        </button>
      ))}
    </div>
  )
}

export function InventoryStatusBanner({
  status,
  dataQuality,
  errorCount,
  warningCount,
}: {
  status: string
  dataQuality: string
  errorCount: number
  warningCount: number
}) {
  const tone =
    errorCount > 0
      ? 'error'
      : warningCount > 0
        ? 'warn'
        : status === 'BLOCKED'
          ? 'error'
          : status === 'COMPLETE' || status.startsWith('SUCCESS')
            ? 'ok'
            : 'neutral'
  return (
    <div className={`status-banner status-banner-${tone}`} role="status">
      <div>
        <strong>Inventory status: {status.replace(/_/g, ' ')}</strong>
        <span>
          Data quality: {dataQuality.replace(/_/g, ' ').toLowerCase()}
          {errorCount > 0 ? ` | ${errorCount} error${errorCount === 1 ? '' : 's'}` : ''}
          {warningCount > 0 ? ` | ${warningCount} warning${warningCount === 1 ? '' : 's'}` : ''}
        </span>
      </div>
    </div>
  )
}

type DriverGroup = { label: string; value: number; unit: 'tCO2' | 'tCO2e' }

export function EmissionsDriverChart({
  gross,
  groups,
}: {
  gross: number
  groups: DriverGroup[]
}) {
  if (groups.length === 0) return null
  return <EmissionsDriverRecharts gross={gross} groups={groups} />
}

export function CementBreakdownCards({
  components,
}: {
  components: Record<string, number>
}) {
  return (
    <div className="summary-cats">
      {Object.entries(components).map(([k, v]) => {
        const { label, unit } = cementComponentLabel(k)
        return (
          <div className="summary-card" key={k}>
            <span>{label}</span>
            <strong>{fmt(v)}</strong>
            <small>{unit}</small>
          </div>
        )
      })}
    </div>
  )
}

export function FactorSnapshotsPanel({ snapshots }: { snapshots: FactorSnapshot[] }) {
  const [onlyCustom, setOnlyCustom] = useState(false)
  const visible = useMemo(
    () => (onlyCustom ? snapshots.filter((s) => s.overridden) : snapshots),
    [onlyCustom, snapshots],
  )
  if (!snapshots.length) return null
  return (
    <div className="form-card">
      <div className="audit-panel-head">
        <div>
          <h2>Factor snapshots</h2>
          <p className="form-sub">
            {snapshots.length} factors recorded with source, version, and priority. Custom values are highlighted.
          </p>
        </div>
        <button
          type="button"
          className={`customise-filter ${onlyCustom ? 'active' : ''}`}
          onClick={() => setOnlyCustom((v) => !v)}
        >
          {onlyCustom ? 'Custom only (filtered)' : 'Custom only'}
        </button>
      </div>
      <div className="result-table audit-table">
        {visible.map((s, i) => (
          <div className="result-row" key={i}>
            <div>
              <strong>
                {s.factorName}
                {s.overridden ? <span className="entry-badge entry-badge-mixed">Custom</span> : null}
              </strong>
              <span>
                {s.source} | {s.sourceVersion}
                {s.factorYear ? ` | ${s.factorYear}` : ''} | priority {s.priorityRank}
                {s.overrideReason ? ` | ${s.overrideReason}` : ''}
              </span>
            </div>
            <strong>
              {fmt4(s.value)} {s.unit}
            </strong>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CalculationTracePanel({ trace }: { trace: TraceEntry[] }) {
  const grouped = useMemo(() => {
    const map = new Map<string, TraceEntry[]>()
    for (const t of trace) {
      const cat = t.category || 'Other'
      const list = map.get(cat) ?? []
      list.push(t)
      map.set(cat, list)
    }
    return [...map.entries()]
  }, [trace])

  if (!trace.length) return null
  return (
    <div className="form-card">
      <h2>Calculation trace</h2>
      <p className="form-sub">{trace.length} steps grouped by category. Expand a section to inspect formulas and fallbacks.</p>
      <div className="trace-groups">
        {grouped.map(([category, steps]) => (
          <details key={category} className="trace-group">
            <summary>
              <span>{category}</span>
              <span className="trace-group-meta">
                {steps.length} step{steps.length === 1 ? '' : 's'} | {fmt(steps.reduce((s, t) => s + t.outputTonnesCO2, 0))} tCO2e
              </span>
            </summary>
            <div className="result-table">
              {steps.map((t, i) => (
                <div className="result-row" key={i}>
                  <div>
                    <strong>{t.step}</strong>
                    <span>
                      {t.method ? `${t.method} | ` : ''}
                      {t.formula}
                      {t.fallbackApplied ? ` | fallback: ${t.fallbackApplied}` : ''}
                    </span>
                  </div>
                  <strong>{fmt4(t.outputTonnesCO2)} tCO2e</strong>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}

export function CategorySummaryCards({
  byCategory,
}: {
  byCategory: Record<string, { co2eTonnes: number }>
}) {
  return (
    <div className="summary-cats">
      {Object.entries(byCategory).map(([k, g]) => (
        <div className="summary-card" key={k}>
          <span>{categoryLabel(k)}</span>
          <strong>{fmt(g.co2eTonnes)}</strong>
          <small>tCO2e</small>
        </div>
      ))}
    </div>
  )
}

export function ByCategoryGasTable({
  byCategory,
  byGas,
  grossCO2e,
  colGrid,
}: {
  byCategory: Record<string, GasAmountsRow>
  byGas: GasAmountsRow & { ch4CO2eTonnes?: number; refrigerantCO2eTonnes?: number }
  grossCO2e: number
  colGrid: string
}) {
  return (
    <div className="form-card">
      <h2>By category</h2>
      <div className="result-table">
        <div className="result-row" style={{ gridTemplateColumns: colGrid, fontWeight: 800, color: 'var(--ink-mute)' }}>
          <span>Category</span>
          <span style={{ textAlign: 'right' }}>CO2 (t)</span>
          <span style={{ textAlign: 'right' }}>CH4 (t)</span>
          <span style={{ textAlign: 'right' }}>N2O (t)</span>
          <span style={{ textAlign: 'right' }}>tCO2e</span>
        </div>
        {Object.entries(byCategory).map(([k, g]) => (
          <div key={k} className="result-row" style={{ gridTemplateColumns: colGrid }}>
            <strong>{categoryLabel(k)}</strong>
            <span style={{ textAlign: 'right' }}>{fmt(g.co2Tonnes)}</span>
            <span style={{ textAlign: 'right' }}>{fmt4(g.ch4Tonnes)}</span>
            <span style={{ textAlign: 'right' }}>{fmt4(g.n2oTonnes)}</span>
            <span style={{ textAlign: 'right' }}>{fmt(g.co2eTonnes)}</span>
          </div>
        ))}
        <div className="result-row" style={{ gridTemplateColumns: colGrid, fontWeight: 800 }}>
          <strong>Gross Scope 1</strong>
          <span style={{ textAlign: 'right' }}>{fmt(byGas.co2Tonnes)}</span>
          <span style={{ textAlign: 'right' }}>{fmt4(byGas.ch4Tonnes)}</span>
          <span style={{ textAlign: 'right' }}>{fmt4(byGas.n2oTonnes)}</span>
          <span style={{ textAlign: 'right' }}>{fmt(grossCO2e)}</span>
        </div>
      </div>
    </div>
  )
}

export function driverGroupsFromCategories(
  byCategory: Record<string, { co2eTonnes: number }>,
): { label: string; value: number; unit: 'tCO2e' }[] {
  return Object.entries(byCategory)
    .filter(([, g]) => g.co2eTonnes > 0)
    .sort((a, b) => b[1].co2eTonnes - a[1].co2eTonnes)
    .map(([k, g]) => ({
      label: categoryLabel(k),
      value: g.co2eTonnes,
      unit: 'tCO2e' as const,
    }))
    .filter((g) => g.value > 0)
}

/* --------------------------- Activity data (Step 4) ----------------------- */

export type ActivityCategoryNav = {
  key: string
  label: string
  icon: ComponentType<{ size?: number; strokeWidth?: number }>
  count: number
  hint: string
}

export function LiveTotalsStrip({
  headlineItems,
  detailItems,
}: {
  headlineItems: { label: string; value: number; unit: string }[]
  detailItems?: { label: string; value: number; unit: string }[]
}) {
  const [expanded, setExpanded] = useState(false)
  const hasDetail = detailItems && detailItems.length > 0
  return (
    <div className="live-totals-strip" aria-live="polite" aria-atomic="false">
      <div className="live-totals-head">
        <h3>Live results</h3>
        {hasDetail ? (
          <button type="button" className="live-totals-toggle" onClick={() => setExpanded((e) => !e)}>
            {expanded ? 'Show less' : 'Show all components'}
          </button>
        ) : null}
      </div>
      <div className="live-totals-grid">
        {headlineItems.map(({ label, value, unit }, i) => (
          <div key={label} className={i === 0 ? 'live-cell live-cell-headline' : 'live-cell'}>
            <div className="live-cell-label">{label}</div>
            <div className="live-cell-value">
              {fmt(value)}
              <span className="live-cell-unit">{unit}</span>
            </div>
          </div>
        ))}
      </div>
      {hasDetail && expanded && (
        <div className="live-totals-grid live-totals-grid-detail">
          {detailItems.map(({ label, value, unit }) => (
            <div key={label} className="live-cell">
              <div className="live-cell-label">{label}</div>
              <div className="live-cell-value">
                {fmt(value)}
                <span className="live-cell-unit">{unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function LiveValidationBanner({
  errors,
  warnings,
  onFieldNavigate,
}: {
  errors: { code?: string; message: string; fieldPath?: string }[]
  warnings: { code?: string; message: string; fieldPath?: string }[]
  onFieldNavigate?: (fieldPath: string) => void
}) {
  const [open, setOpen] = useState(false)
  if (errors.length === 0 && warnings.length === 0) return null
  const total = errors.length + warnings.length
  const previewErr = errors.slice(0, 3)
  const previewWarn = warnings.slice(0, errors.length > 0 ? 2 : 4)
  return (
    <div
      className={`live-validation-banner ${errors.length > 0 ? 'live-validation-error' : 'live-validation-warn'}`}
      role="status"
    >
      <div className="live-validation-head">
        <strong>
          {errors.length > 0
            ? `${errors.length} issue${errors.length === 1 ? '' : 's'} blocking a clean inventory`
            : `${warnings.length} warning${warnings.length === 1 ? '' : 's'} to review`}
        </strong>
        {total > previewErr.length + previewWarn.length ? (
          <button type="button" className="btn ghost live-validation-toggle" onClick={() => setOpen((v) => !v)}>
            {open ? 'Hide full list' : `Show all ${total}`}
          </button>
        ) : null}
      </div>
      <ul>
        {(open ? errors : previewErr).map((e, i) => (
          <li key={`e${i}`} className="text-error">
            {e.code ? `${e.code}: ` : ''}
            {e.message}
            {e.fieldPath && onFieldNavigate ? (
              <button type="button" className="live-validation-jump" onClick={() => onFieldNavigate(e.fieldPath!)}>
                Go to field
              </button>
            ) : e.fieldPath ? (
              <span className="live-validation-field"> ({e.fieldPath})</span>
            ) : null}
          </li>
        ))}
        {(open ? warnings : previewWarn).map((w, i) => (
          <li key={`w${i}`} className="text-warn">
            {w.code ? `${w.code}: ` : ''}
            {w.message}
            {w.fieldPath && onFieldNavigate ? (
              <button type="button" className="live-validation-jump" onClick={() => onFieldNavigate(w.fieldPath!)}>
                Go to field
              </button>
            ) : w.fieldPath ? (
              <span className="live-validation-field"> ({w.fieldPath})</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}

export type ReconciliationLine = {
  metric: string
  label: string
  disclosed?: number | null
  modelled: number
  variancePercent?: number | null
  unit: string
  withinThreshold?: boolean
}

export function ReconciliationPanel({
  note,
  lines,
  simple,
}: {
  note?: string
  lines?: ReconciliationLine[]
  simple?: { disclosed: number; modelled: number; variancePercent: number | null }
}) {
  const grid = '2fr 1fr 1fr 1fr 1fr'
  return (
    <div className="form-card">
      <h2>Reconciliation vs disclosed figures</h2>
      {note ? <p className="form-sub">{note}</p> : null}
      {simple ? (
        <div className="result-table">
          <div className="result-row">
            <strong>Disclosed gross Scope 1</strong>
            <span style={{ textAlign: 'right' }}>{fmt(simple.disclosed)} tCO2e</span>
          </div>
          <div className="result-row">
            <strong>Modelled gross Scope 1</strong>
            <span style={{ textAlign: 'right' }}>{fmt(simple.modelled)} tCO2e</span>
          </div>
          <div className="result-row">
            <strong>Variance</strong>
            <span style={{ textAlign: 'right', fontWeight: 700 }}>
              {fmt(simple.variancePercent ?? 0)}%
              {Math.abs(simple.variancePercent ?? 0) > 5 ? ' - review' : ' - within threshold'}
            </span>
          </div>
        </div>
      ) : null}
      {lines && lines.length > 0 ? (
        <div className="result-table">
          <div className="result-row" style={{ gridTemplateColumns: grid, fontWeight: 800, color: 'var(--ink-mute)' }}>
            <span>Metric</span>
            <span style={{ textAlign: 'right' }}>Disclosed</span>
            <span style={{ textAlign: 'right' }}>Modelled</span>
            <span style={{ textAlign: 'right' }}>Variance</span>
            <span style={{ textAlign: 'right' }}>Status</span>
          </div>
          {lines.map((l) => (
            <div key={l.metric} className="result-row" style={{ gridTemplateColumns: grid }}>
              <strong>{l.label}</strong>
              <span style={{ textAlign: 'right' }}>
                {fmt(l.disclosed ?? 0)} {l.unit}
              </span>
              <span style={{ textAlign: 'right' }}>
                {fmt(l.modelled)} {l.unit}
              </span>
              <span style={{ textAlign: 'right' }}>{fmt(l.variancePercent ?? 0)}%</span>
              <span
                style={{
                  textAlign: 'right',
                  color: l.withinThreshold ? 'var(--status-ok)' : 'var(--status-warn)',
                  fontWeight: 700,
                }}
              >
                {l.withinThreshold ? 'within threshold' : 'review'}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function VersionHistoryPanel({
  versions,
  currentGross,
  onRestore,
}: {
  versions: InventoryVersionSnapshot[]
  currentGross: number
  onRestore?: (snap: InventoryVersionSnapshot) => void
}) {
  const dialog = useAppDialog()
  if (versions.length === 0) return null
  const prev = versions[0]
  const delta = compareGrossDelta(prev.grossScope1, currentGross)
  return (
    <div className="form-card version-history-panel">
      <h2>Version history (this browser)</h2>
      <p className="form-sub">
        Snapshots saved when you calculate. Compare against the previous run before exporting.
      </p>
      {versions.length > 0 ? (
        <p className="form-sub">
          vs last snapshot ({new Date(prev.savedAt).toLocaleString()}):{' '}
          <strong>
            {delta >= 0 ? '+' : ''}
            {fmt(delta)}% gross Scope 1
          </strong>
        </p>
      ) : null}
      <ul className="version-history-list">
        {versions.slice(0, 5).map((v) => (
          <li key={v.id} className="version-history-item">
            <div>
              <strong>{v.label}</strong>
              <span>
                {fmt(v.grossScope1)} tCO2e | {v.status} | {new Date(v.savedAt).toLocaleString()}
              </span>
            </div>
            {onRestore ? (
              <button
                type="button"
                className="btn ghost"
                onClick={async () => {
                  const ok = await dialog.confirm(
                    `Restore inventory from ${new Date(v.savedAt).toLocaleString()}? Unsaved edits on this step will be replaced.`,
                    'Restore inventory',
                  )
                  if (ok) onRestore(v)
                }}
              >
                Restore
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}

export { listInventoryVersions }

function CategoryNavButton({
  item,
  active,
  onSelect,
  layout,
}: {
  item: ActivityCategoryNav
  active: boolean
  onSelect: () => void
  layout: 'side' | 'tabs'
}) {
  const Icon = item.icon
  if (layout === 'tabs') {
    return (
      <button type="button" className={active ? 'active' : ''} onClick={onSelect}>
        <Icon size={15} />
        {item.label}
        <span>{item.count}</span>
      </button>
    )
  }
  return (
    <button type="button" className={`activity-nav-item ${active ? 'active' : ''}`} onClick={onSelect}>
      <Icon size={17} />
      <span className="activity-nav-label">{item.label}</span>
      <span className="activity-nav-count">{item.count}</span>
    </button>
  )
}

export function MethodologyContextStrip({
  profileTitle,
  summaryLines,
  onEditMethods,
}: {
  profileTitle: string
  summaryLines: string[]
  onEditMethods?: () => void
}) {
  return (
    <div className="methodology-context-strip">
      <div>
        <span className="methodology-context-label">Methodology from Step 3</span>
        <strong>{profileTitle}</strong>
        <ul>
          {summaryLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
      {onEditMethods ? (
        <button type="button" className="btn ghost" onClick={onEditMethods}>
          Edit methods
        </button>
      ) : null}
    </div>
  )
}

export function ActivityDataShell({
  categories,
  activeKey,
  onCategoryChange,
  liveTotals,
  methodology,
  validation,
  advanced,
  tools,
  onFieldNavigate,
  children,
  footer,
}: {
  categories: ActivityCategoryNav[]
  activeKey: string
  onCategoryChange: (key: string) => void
  liveTotals: React.ReactNode
  methodology?: { profileTitle: string; summaryLines: string[]; onEditMethods?: () => void }
  validation?: {
    errors: { code?: string; message: string; fieldPath?: string }[]
    warnings: { code?: string; message: string; fieldPath?: string }[]
  }
  advanced?: React.ReactNode
  tools?: React.ReactNode
  onFieldNavigate?: (fieldPath: string) => void
  children: React.ReactNode
  footer: React.ReactNode
}) {
  const active = categories.find((c) => c.key === activeKey) ?? categories[0]

  return (
    <section className="step-page active activity-data-page">
      {methodology ? (
        <MethodologyContextStrip
          profileTitle={methodology.profileTitle}
          summaryLines={methodology.summaryLines}
          onEditMethods={methodology.onEditMethods}
        />
      ) : null}

      {liveTotals}

      <div className="activity-data-page-header">
        <div className="activity-data-title-row">
          <h1 className="step-title">
            Enter your activity <em>data</em>
          </h1>
          {tools ? <div className="activity-data-tools-wrap">{tools}</div> : null}
        </div>
        <p className="step-sub">
          Enter reporting-period quantities by emission category. Leave a field blank if unknown; enter{' '}
          <b>0</b> only for a verified actual zero.
        </p>
      </div>

      {validation ? (
        <LiveValidationBanner
          errors={validation.errors}
          warnings={validation.warnings}
          onFieldNavigate={onFieldNavigate}
        />
      ) : null}

      <div className="activity-layout">
        <nav className="activity-nav-side" aria-label="Emission categories">
          {categories.map((item) => (
            <CategoryNavButton
              key={item.key}
              item={item}
              active={activeKey === item.key}
              onSelect={() => onCategoryChange(item.key)}
              layout="side"
            />
          ))}
        </nav>

        <div className="activity-main">
          <nav className="category-tabs activity-nav-mobile" aria-label="Emission categories">
            {categories.map((item) => (
              <CategoryNavButton
                key={item.key}
                item={item}
                active={activeKey === item.key}
                onSelect={() => onCategoryChange(item.key)}
                layout="tabs"
              />
            ))}
          </nav>

          <div className="activity-category-intro">
            <h2>{active.label}</h2>
            <p className="form-sub">{active.hint}</p>
          </div>

          <div className="category-panel active">{children}</div>

          {advanced ? (
            <details className="activity-advanced">
              <summary>Advanced options (factor overrides)</summary>
              <div className="activity-advanced-body">{advanced}</div>
            </details>
          ) : null}
        </div>
      </div>

      <div className="activity-footer">{footer}</div>
    </section>
  )
}

export function StickyExportBar({
  busy,
  onPdf,
  onExcel,
  onJson,
  onSave,
  onLock,
  locked,
  signoff,
}: {
  busy: boolean
  onPdf: () => void
  onExcel: () => void
  onJson: () => void
  onSave?: () => void
  onLock?: () => void
  locked?: boolean
  signoff?: ReportSignoffInput
}) {
  const dialog = useAppDialog()
  const warnSignoff = signoff && !hasSignoffContact(signoff)

  async function guardedExport(run: () => void, label: string) {
    if (warnSignoff) {
      const ok = await dialog.confirm(
        `No prepared-by name and work email on the sign-off block. Export ${label} anyway?`,
        'Export inventory',
      )
      if (!ok) return
    }
    run()
  }

  return (
    <div className="sticky-export-bar">
      <span className="sticky-export-label">
        Export inventory
        {warnSignoff ? <em className="sticky-export-hint">Sign-off contact not complete</em> : null}
      </span>
      <div className="sticky-export-actions">
        <button type="button" className="btn primary" onClick={() => void guardedExport(onPdf, 'PDF')}>
          PDF report
        </button>
        <button type="button" className="btn secondary" onClick={() => void guardedExport(onExcel, 'Excel')}>
          Excel + trace
        </button>
        <button type="button" className="btn ghost" onClick={() => void guardedExport(onJson, 'JSON')}>
          JSON
        </button>
        {onSave ? (
          <button type="button" className="btn ghost" disabled={busy} onClick={onSave}>
            {busy ? 'Saving...' : 'Save to database'}
          </button>
        ) : null}
        {onLock ? (
          <button
            type="button"
            className="btn primary"
            disabled={busy || locked}
            onClick={onLock}
            style={locked ? { background: '#15803d' } : undefined}
          >
            {locked ? 'Submitted for review' : busy ? 'Submitting…' : 'Submit for review'}
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function ActivityDataTools({
  sector,
  onImportJson,
  onImportExcel,
  onFillSampleRow,
}: {
  sector: 'cement' | 'oil_gas' | 'pulp_paper'
  onImportJson?: (file: File) => void
  onImportExcel?: (file: File) => void
  onFillSampleRow?: () => void
}) {
  const jsonHref = `/templates/activity-${sector.replace('_', '-')}.json`
  const xlsxHref = scope1Api(`/api/v1/templates/activity?sector=${sector}`)
  return (
    <div className="activity-data-tools">
      <a className="btn ghost" href={jsonHref} download>
        JSON template
      </a>
      <a className="btn ghost" href={xlsxHref} download>
        Excel template
      </a>
      {onImportJson ? (
        <label className="btn ghost activity-import-label">
          Import JSON
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onImportJson(f)
              e.currentTarget.value = ''
            }}
          />
        </label>
      ) : null}
      {onImportExcel ? (
        <label className="btn ghost activity-import-label">
          Import Excel
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onImportExcel(f)
              e.currentTarget.value = ''
            }}
          />
        </label>
      ) : null}
      {onFillSampleRow ? (
        <button type="button" className="btn ghost" onClick={onFillSampleRow}>
          Fill sample row (this category)
        </button>
      ) : null}
    </div>
  )
}
