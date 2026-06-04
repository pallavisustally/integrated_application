'use client'

import { useMemo, useState } from 'react'

import type { MethodSelections } from '@/lib/engine/types'
import type { OilGasGwpSet, OilGasInputPayload } from '@/lib/engine/oilgas'
import type { PulpPaperInputPayload } from '@/lib/engine/pulppaper'
import { MethodologyDecisionTree } from '@/components/methodology-decision-tree'
import { AccessibleSelect } from '@/lib/ui/form-fields'
import {
  CEMENT_TIER_STEPS,
  OIL_GAS_TIER_STEPS,
  PULP_TIER_STEPS,
} from '@/lib/ui/methodology-tiers'
import {
  applyCementProfile,
  applyOilGasMethods,
  applyPulpPaperMethods,
  cementMethodLabel,
  cementMethodSummary,
  CEMENT_PROFILES,
  detectCementProfile,
  detectOilGasProfile,
  detectPulpPaperProfile,
  oilGasMethodSummary,
  OIL_GAS_PROFILES,
  PULP_PAPER_PROFILES,
  pulpPaperMethodSummary,
  type MethodProfileOption,
} from '@/lib/ui/methodology'

function MethodProfileCards({
  profiles,
  activeId,
  onSelect,
}: {
  profiles: MethodProfileOption[]
  activeId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="method-profiles" role="radiogroup" aria-label="Methodology profile">
      {profiles.map((p) => (
        <button
          key={p.id}
          type="button"
          role="radio"
          aria-checked={activeId === p.id}
          className={`method-profile-card ${activeId === p.id ? 'selected' : ''}`}
          onClick={() => onSelect(p.id)}
        >
          {p.recommended ? <span className="method-profile-badge">Recommended</span> : null}
          <strong>{p.title}</strong>
          <span className="method-profile-desc">{p.description}</span>
          <span className="method-profile-when">
            <b>Best when:</b> {p.when}
          </span>
        </button>
      ))}
    </div>
  )
}

function MethodExpertSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return <AccessibleSelect label={label} value={value} onChange={onChange} options={options} />
}

function MethodSummaryBox({ lines }: { lines: string[] }) {
  return (
    <div className="method-summary">
      <div className="method-summary-title">Current methodology</div>
      <ul>
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  )
}

export function CementMethodologyGuide({
  methodSelections,
  onPatchMethods,
}: {
  methodSelections: MethodSelections
  onPatchMethods: (mut: (ms: MethodSelections) => void) => void
}) {
  const activeProfile = useMemo(() => detectCementProfile(methodSelections), [methodSelections])
  const [expertOpen, setExpertOpen] = useState(activeProfile === 'expert')

  function selectProfile(id: string) {
    if (id === 'expert') {
      setExpertOpen(true)
      return
    }
    setExpertOpen(false)
    onPatchMethods((ms) => {
      Object.assign(ms, applyCementProfile(ms, id))
    })
  }

  const ms = methodSelections

  return (
    <div className="form-card">
      <h2>Methodology profile</h2>
      <p className="form-sub">
        Choose a reporting path aligned with CSI Cement CO2 Protocol v3. The engine applies fallbacks automatically if
        required data is missing, and records a warning in your report.
      </p>
      <MethodProfileCards profiles={CEMENT_PROFILES} activeId={activeProfile} onSelect={selectProfile} />
      <MethodSummaryBox lines={cementMethodSummary(ms)} />
      <button type="button" className="method-expert-toggle" onClick={() => setExpertOpen((o) => !o)}>
        {expertOpen ? 'Hide expert settings' : 'Show expert settings (all method fields)'}
      </button>
      {expertOpen && (
        <div className="method-expert-panel">
          <div className="field-row">
            <MethodExpertSelect
              label="Process method"
              value={ms.processEmissionMethod}
              onChange={(v) =>
                onPatchMethods((m) => {
                  m.processEmissionMethod = v as MethodSelections['processEmissionMethod']
                })
              }
              options={[
                { value: 'CSI_CLINKER_BASED', label: cementMethodLabel('processEmissionMethod', 'CSI_CLINKER_BASED') },
                {
                  value: 'US_EPA_CEMENT_BASED_FALLBACK',
                  label: cementMethodLabel('processEmissionMethod', 'US_EPA_CEMENT_BASED_FALLBACK'),
                },
              ]}
            />
            <MethodExpertSelect
              label="Clinker EF method"
              value={ms.clinkerEmissionFactorMethod}
              onChange={(v) =>
                onPatchMethods((m) => {
                  m.clinkerEmissionFactorMethod = v as MethodSelections['clinkerEmissionFactorMethod']
                })
              }
              options={(['PLANT_SPECIFIC_CAO_MGO', 'CSI_DEFAULT_525', 'IPCC_DEFAULT_510'] as const).map((v) => ({
                value: v,
                label: cementMethodLabel('clinkerEmissionFactorMethod', v),
              }))}
            />
          </div>
          <div className="field-row">
            <MethodExpertSelect
              label="Dust method"
              value={ms.dustMethod}
              onChange={(v) =>
                onPatchMethods((m) => {
                  m.dustMethod = v as MethodSelections['dustMethod']
                })
              }
              options={(['ACTUAL_DUST_DATA', 'IPCC_2_PERCENT_FALLBACK', 'NOT_APPLICABLE'] as const).map((v) => ({
                value: v,
                label: cementMethodLabel('dustMethod', v),
              }))}
            />
            <MethodExpertSelect
              label="Raw meal TOC method"
              value={ms.tocMethod}
              onChange={(v) =>
                onPatchMethods((m) => {
                  m.tocMethod = v as MethodSelections['tocMethod']
                })
              }
              options={(['CSI_DEFAULT_TOC', 'PLANT_SPECIFIC_TOC', 'NOT_APPLICABLE'] as const).map((v) => ({
                value: v,
                label: cementMethodLabel('tocMethod', v),
              }))}
            />
            <MethodExpertSelect
              label="Fuel combustion method"
              value={ms.fuelCombustionMethod}
              onChange={(v) =>
                onPatchMethods((m) => {
                  m.fuelCombustionMethod = v as MethodSelections['fuelCombustionMethod']
                })
              }
              options={(['ENERGY_BASED', 'CARBON_CONTENT_BASED', 'DIRECT_MEASUREMENT'] as const).map((v) => ({
                value: v,
                label: cementMethodLabel('fuelCombustionMethod', v),
              }))}
            />
          </div>
          <div className="field-row">
            <MethodExpertSelect
              label="Mobile combustion method"
              value={ms.mobileCombustionMethod}
              onChange={(v) =>
                onPatchMethods((m) => {
                  m.mobileCombustionMethod = v as MethodSelections['mobileCombustionMethod']
                })
              }
              options={(['FUEL_BASED', 'DISTANCE_BASED', 'EQUIPMENT_HOURS_BASED'] as const).map((v) => ({
                value: v,
                label: cementMethodLabel('mobileCombustionMethod', v),
              }))}
            />
          </div>
        </div>
      )}
      <MethodologyDecisionTree steps={CEMENT_TIER_STEPS} />
    </div>
  )
}

export function OilGasMethodologyGuide({
  payload,
  onPatch,
}: {
  payload: OilGasInputPayload
  onPatch: (mut: (d: OilGasInputPayload) => void) => void
}) {
  const ms = payload.methodSelections
  const activeProfile = useMemo(() => detectOilGasProfile(ms), [ms])
  const [expertOpen, setExpertOpen] = useState(activeProfile === 'expert')

  function selectProfile(id: string) {
    if (id === 'expert') {
      setExpertOpen(true)
      return
    }
    setExpertOpen(false)
    onPatch((d) => {
      Object.assign(d.methodSelections, applyOilGasMethods(d, id))
    })
  }

  return (
    <div className="form-card">
      <h2>Methodology profile</h2>
      <p className="form-sub">
        IPIECA / API Compendium-style combustion methods. Flaring, venting, and fugitive use sector defaults unless you
        override factors on individual rows.
      </p>
      <MethodProfileCards profiles={OIL_GAS_PROFILES} activeId={activeProfile} onSelect={selectProfile} />
      <MethodSummaryBox lines={oilGasMethodSummary(ms, payload.calculationContext.gwpSet)} />
      <button type="button" className="method-expert-toggle" onClick={() => setExpertOpen((o) => !o)}>
        {expertOpen ? 'Hide expert settings' : 'Show expert settings'}
      </button>
      {expertOpen && (
        <div className="method-expert-panel">
          <div className="field-row">
            <MethodExpertSelect
              label="Stationary combustion method"
              value={ms.stationaryCombustionMethod}
              onChange={(v) =>
                onPatch((d) => {
                  d.methodSelections.stationaryCombustionMethod = v as typeof ms.stationaryCombustionMethod
                })
              }
              options={[
                { value: 'ENERGY_BASED', label: 'Energy-based (fuel x NCV x EF)' },
                { value: 'CARBON_CONTENT_BASED', label: 'Carbon-content based' },
                { value: 'DIRECT_MEASUREMENT', label: 'Direct measurement (CEMS)' },
              ]}
            />
            <MethodExpertSelect
              label="Mobile combustion method"
              value={ms.mobileCombustionMethod}
              onChange={(v) =>
                onPatch((d) => {
                  d.methodSelections.mobileCombustionMethod = v as typeof ms.mobileCombustionMethod
                })
              }
              options={[
                { value: 'FUEL_BASED', label: 'Fuel-based (preferred)' },
                { value: 'DISTANCE_BASED', label: 'Distance-based' },
                { value: 'EQUIPMENT_HOURS_BASED', label: 'Equipment hours' },
              ]}
            />
            <MethodExpertSelect
              label="GWP basis (reporting)"
              value={payload.calculationContext.gwpSet}
              onChange={(v) =>
                onPatch((d) => {
                  d.calculationContext.gwpSet = v as OilGasGwpSet
                })
              }
              options={[
                { value: 'AR5_100', label: 'AR5 - 100-year' },
                { value: 'AR6_100', label: 'AR6 - 100-year' },
                { value: 'AR6_20', label: 'AR6 - 20-year (methane-weighted)' },
              ]}
            />
          </div>
          <p className="form-sub">GWP is also in the header. Changing it recalculates all CO2e values.</p>
        </div>
      )}
      <MethodologyDecisionTree steps={OIL_GAS_TIER_STEPS} />
    </div>
  )
}

export function PulpPaperMethodologyGuide({
  methodSelections,
  onPatchMethods,
}: {
  methodSelections: PulpPaperInputPayload['methodSelections']
  onPatchMethods: (mut: (ms: PulpPaperInputPayload['methodSelections']) => void) => void
}) {
  const activeProfile = useMemo(() => detectPulpPaperProfile(methodSelections), [methodSelections])
  const [expertOpen, setExpertOpen] = useState(activeProfile === 'expert')

  function selectProfile(id: string) {
    if (id === 'expert') {
      setExpertOpen(true)
      return
    }
    setExpertOpen(false)
    onPatchMethods((ms) => {
      Object.assign(ms, applyPulpPaperMethods(ms, id))
    })
  }

  const ms = methodSelections

  return (
    <div className="form-card">
      <h2>Methodology profile</h2>
      <p className="form-sub">
        ICFPA / NCASI pulp and paper methods. Mill type on this step controls which activity categories apply on the
        next step.
      </p>
      <MethodProfileCards profiles={PULP_PAPER_PROFILES} activeId={activeProfile} onSelect={selectProfile} />
      <MethodSummaryBox lines={pulpPaperMethodSummary(ms)} />
      <button type="button" className="method-expert-toggle" onClick={() => setExpertOpen((o) => !o)}>
        {expertOpen ? 'Hide expert settings' : 'Show expert settings'}
      </button>
      {expertOpen && (
        <div className="method-expert-panel">
          <div className="field-row">
            <MethodExpertSelect
              label="Stationary combustion method"
              value={ms.stationaryMethod}
              onChange={(v) =>
                onPatchMethods((m) => {
                  m.stationaryMethod = v as typeof ms.stationaryMethod
                })
              }
              options={[
                { value: 'ENERGY_BASED', label: 'Energy-based (qty x NCV x EF)' },
                { value: 'CARBON_CONTENT_BASED', label: 'Carbon-content (Tier 3/4)' },
                { value: 'DIRECT_MEASUREMENT', label: 'Direct measurement (CEMS)' },
              ]}
            />
            <MethodExpertSelect
              label="Mobile method"
              value={ms.mobileMethod}
              onChange={(v) =>
                onPatchMethods((m) => {
                  m.mobileMethod = v as typeof ms.mobileMethod
                })
              }
              options={[
                { value: 'FUEL_BASED', label: 'Fuel-based (preferred)' },
                { value: 'DISTANCE_BASED', label: 'Distance-based' },
              ]}
            />
          </div>
        </div>
      )}
      <MethodologyDecisionTree steps={PULP_TIER_STEPS} />
    </div>
  )
}
