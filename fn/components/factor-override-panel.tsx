'use client'

import { Info, Search } from 'lucide-react'
import { useState } from 'react'

import type { FactorOverride } from '@/lib/engine/types'
import { AccessibleNumField, FocusTrapModal } from '@/lib/ui/form-fields'

type Num = number | null

type FactorRow = {
  factorCode: string
  factorName: string
  value: number
  unit: string
  source: string
}

export function FactorOverridePanel({
  factors,
  overrides,
  onChange,
  standardsNote = 'GHG Protocol Corporate Standard, ISO 14064-1, and IPCC 2006 Tier hierarchy.',
}: {
  factors: FactorRow[]
  overrides: Record<string, FactorOverride>
  onChange: (o: Record<string, FactorOverride>) => void
  standardsNote?: string
}) {
  const [query, setQuery] = useState('')
  const [onlyOver, setOnlyOver] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const overrideCount = Object.keys(overrides).length
  const q = query.trim().toLowerCase()
  const visible = factors.filter((f) => {
    if (onlyOver && !overrides[f.factorCode]) return false
    if (!q) return true
    return (
      f.factorName.toLowerCase().includes(q) ||
      f.factorCode.toLowerCase().includes(q) ||
      f.source.toLowerCase().includes(q)
    )
  })

  function setOverride(code: string, value: Num, existingReason: string) {
    const next = { ...overrides }
    if (value === null) {
      delete next[code]
    } else {
      if (value === 0) {
        const ok =
          typeof window !== 'undefined' &&
          window.confirm('You are replacing the default factor with zero. Is this intentional?')
        if (!ok) return
      }
      next[code] = { value, reason: existingReason }
    }
    onChange(next)
  }
  function clearOverride(code: string) {
    const next = { ...overrides }
    delete next[code]
    onChange(next)
  }
  function setReason(code: string, reason: string) {
    const next = { ...overrides }
    if (next[code]) next[code] = { ...next[code], reason }
    onChange(next)
  }

  return (
    <div className="form-card">
      <h2 style={{ display: 'inline-flex', alignItems: 'center' }}>
        Customise factors
        <button
          type="button"
          className="info-btn"
          aria-label="About customising factors"
          title="Why this exists and when to use it"
          onClick={() => setInfoOpen(true)}
        >
          <Info size={12} />
        </button>
      </h2>
      <div className="customise-meta">
        <span className="customise-meta-pill muted">{factors.length} factors in library</span>
        {overrideCount > 0 ? <span className="customise-meta-pill">{overrideCount} customised</span> : null}
      </div>
      <p className="form-sub" style={{ marginTop: 8 }}>
        Replace a library default with plant- or supplier-specific data. The override value and reason are recorded in
        the report factor snapshot.
      </p>

      <div className="customise-toolbar">
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 12, color: 'var(--muted)' }} aria-hidden />
          <input
            className="customise-search"
            style={{ paddingLeft: 32 }}
            placeholder="Search factors by name, code, or source"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search factors"
          />
        </div>
        <button
          type="button"
          className={`customise-filter ${onlyOver ? 'active' : ''}`}
          onClick={() => setOnlyOver((v) => !v)}
        >
          {onlyOver ? 'Only customised' : 'Only customised'}
        </button>
      </div>

      <div className="customise-list">
        {visible.length === 0 && (
          <div className="customise-empty">
            {onlyOver ? 'No customised factors yet.' : 'No factors match your search.'}
          </div>
        )}
        {visible.map((f) => {
          const ov = overrides[f.factorCode]
          const isOver = !!ov
          const isOpen = isOver || expanded.has(f.factorCode)
          return (
            <div key={f.factorCode} className={`customise-row ${isOver ? 'is-overridden' : ''}`}>
              <div className="customise-row-head">
                <div>
                  <div className="customise-row-name">{f.factorName}</div>
                  <div className="customise-row-meta">
                    Default <b>{f.value}</b> {f.unit} | {f.source}
                  </div>
                </div>
                <div className="customise-row-actions">
                  {isOver ? (
                    <>
                      <span className="customise-row-state">CUSTOMISED: {ov.value}</span>
                      <button type="button" className="customise-reset" onClick={() => clearOverride(f.factorCode)}>
                        Reset
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="customise-toggle"
                      onClick={() =>
                        setExpanded((s) => {
                          const n = new Set(s)
                          if (n.has(f.factorCode)) n.delete(f.factorCode)
                          else n.add(f.factorCode)
                          return n
                        })
                      }
                    >
                      {isOpen ? 'Cancel' : 'Override'}
                    </button>
                  )}
                </div>
              </div>
              {isOpen ? (
                <div className="customise-row-body">
                  <div className="field-row">
                    <AccessibleNumField
                      label="Override value"
                      unit={f.unit}
                      step="0.0001"
                      value={ov ? ov.value : null}
                      onChange={(v) => setOverride(f.factorCode, v, ov?.reason ?? '')}
                    />
                    <label className="field" style={{ gridColumn: 'span 2' }}>
                      <span className="field-title">Reason (recorded in factor snapshot)</span>
                      <input
                        value={ov?.reason ?? ''}
                        placeholder="e.g. Plant lab analysis, certificate ref ABC/2026"
                        disabled={!ov}
                        aria-invalid={isOver && !(ov?.reason ?? '').trim() ? true : undefined}
                        onChange={(e) => setReason(f.factorCode, e.target.value)}
                      />
                    </label>
                  </div>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      <FocusTrapModal open={infoOpen} title="About customising factors" onClose={() => setInfoOpen(false)}>
        <p>
          The factor library ships with internationally recognised defaults. Override one only when you hold
          higher-quality, plant- or supplier-specific data, and record the reason. Every change is preserved in the
          factor snapshot so the inventory stays audit-traceable.
        </p>
        <h4>Recommended when</h4>
        <ul>
          <li>You have lab-measured chemistry, calorific values, or carbon content (IPCC Tier 3 data).</li>
          <li>A supplier provides a verified emission factor or fuel composition.</li>
          <li>An updated official factor applies for the reporting year.</li>
        </ul>
        <h4>Standards followed</h4>
        <p>{standardsNote}</p>
        <div className="modal-foot-note">
          <b>Avoid otherwise.</b> Library defaults are cited and defensible; replacing them without evidence weakens
          assurance readiness.
        </div>
      </FocusTrapModal>
    </div>
  )
}
