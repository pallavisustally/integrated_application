'use client'

import type { InventorySourceDef } from '@/lib/ui/source-catalog'
import { EXCLUSION_REASON_PRESETS } from '@/lib/ui/activity-fields'

export function SourceApplicabilityPanel({
  sources,
  flags,
  reasons,
  lockedExcluded = [],
  onChange,
  fieldErrors,
}: {
  sources: InventorySourceDef[]
  flags: Record<string, boolean>
  reasons?: Record<string, string>
  /** Keys that must stay excluded (facility rules). */
  lockedExcluded?: string[]
  onChange: (key: string, included: boolean, reason: string) => void
  fieldErrors?: Record<string, string>
}) {
  const locked = new Set(lockedExcluded)
  const includedCount = sources.filter((s) => flags[s.key] !== false).length

  return (
    <div className="form-card source-applicability-panel">
      <h2>Sources in this inventory</h2>
      <p className="form-sub">
        Choose which emission sources apply at this facility. Excluded sources are not calculated; record a short
        audit reason for each exclusion ({includedCount} of {sources.length} included).
      </p>
      <ul className="source-applicability-list">
        {sources.map((src) => {
          const included = flags[src.key] !== false
          const isLocked = locked.has(src.key)
          const reason = reasons?.[src.key] ?? ''
          const err = fieldErrors?.[src.key]
          const reasonId = `src-reason-${src.key}`
          const labelId = `src-label-${src.key}`

          return (
            <li
              key={src.key}
              className={`source-applicability-row${included ? '' : ' source-applicability-row-excluded'}`}
            >
              <div className="source-applicability-main">
                <label className="source-applicability-check" id={labelId}>
                  <input
                    type="checkbox"
                    checked={included}
                    disabled={isLocked}
                    aria-describedby={src.hint ? `${src.key}-hint` : undefined}
                    onChange={(e) => onChange(src.key, e.target.checked, reason)}
                  />
                  <span>
                    <strong>{src.label}</strong>
                    {isLocked ? (
                      <span className="source-applicability-lock">Required off for this facility type</span>
                    ) : null}
                    {src.hint ? (
                      <span className="source-applicability-hint" id={`${src.key}-hint`}>
                        {src.hint}
                      </span>
                    ) : null}
                  </span>
                </label>
              </div>
              {!included ? (
                <label className="field source-applicability-reason">
                  <span className="field-title">
                    Exclusion reason<span className="required-mark">*</span>
                  </span>
                  <div className="exclusion-presets" role="group" aria-label="Reason presets">
                    {EXCLUSION_REASON_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className="btn ghost exclusion-preset-btn"
                        disabled={isLocked}
                        onClick={() => onChange(src.key, false, preset)}
                      >
                        {preset.length > 42 ? `${preset.slice(0, 40)}...` : preset}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    value={reason}
                    disabled={isLocked}
                    placeholder="e.g. No kiln at this grinding unit; not operationally controlled"
                    aria-labelledby={labelId}
                    aria-describedby={err ? `${reasonId}-err` : undefined}
                    aria-invalid={err ? true : undefined}
                    id={reasonId}
                    onChange={(e) => onChange(src.key, false, e.target.value)}
                  />
                  {err ? (
                    <div id={`${reasonId}-err`} className="field-error" role="alert">
                      {err}
                    </div>
                  ) : null}
                </label>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
