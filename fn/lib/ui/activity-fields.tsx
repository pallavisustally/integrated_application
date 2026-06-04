'use client'

import type { ReactNode } from 'react'

export function codesToOptions(codes: readonly string[], labelFn?: (code: string) => string) {
  return codes.map((c) => ({ value: c, label: labelFn ? labelFn(c) : c }))
}

/** Label + accessible select for activity entry rows and methodology expert fields. */
export function EntryLabeledSelect({
  label,
  ariaLabel,
  value,
  onChange,
  options,
}: {
  label: string
  ariaLabel?: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <label className="field">
      {label}
      <EntryCodeSelect
        ariaLabel={ariaLabel ?? label}
        value={value}
        onChange={onChange}
        options={options}
      />
    </label>
  )
}

/** Compact accessible select for activity entry grid cells. */
export function EntryCodeSelect({
  ariaLabel,
  value,
  onChange,
  options,
}: {
  ariaLabel: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <select
      className="entry-code-select"
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export const EXCLUSION_REASON_PRESETS = [
  'Not operationally controlled under selected boundary',
  'No physical source at this facility',
  'Below materiality threshold for this reporting period',
  'Measured and reported in a separate legal entity inventory',
  'Grinding unit - no kiln / process source at site',
] as const

export function ActivityEmptyState({
  title,
  hint,
  onAdd,
  addLabel = 'Add entry',
}: {
  title: string
  hint: string
  onAdd: () => void
  addLabel?: string
}) {
  return (
    <div className="activity-empty-state">
      <p>
        <strong>{title}</strong>
      </p>
      <p className="form-sub">{hint}</p>
      <button type="button" className="add-entry-btn" onClick={onAdd}>
        {addLabel}
      </button>
    </div>
  )
}

export function ActivityEntryGrid({
  children,
  columns,
}: {
  columns: ReactNode
  children: ReactNode
}) {
  return (
    <div className="activity-entry-grid-wrap">
      <div className="entry-grid entry-grid-head" role="row">
        {columns}
      </div>
      {children}
    </div>
  )
}
