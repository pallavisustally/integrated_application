'use client'

import type { TierStep } from '@/lib/ui/methodology-tiers'

export function MethodologyDecisionTree({ steps, title = 'Method tier fallbacks' }: { steps: TierStep[]; title?: string }) {
  return (
    <div className="form-card methodology-tier-tree">
      <h2>{title}</h2>
      <p className="form-sub">
        The engine never silently drops a source. If data for your selected tier is missing, it applies the next-best
        method and records a warning in the audit trail.
      </p>
      <ol className="tier-tree-list">
        {steps.map((s) => (
          <li key={s.tier} className="tier-tree-item">
            <div className="tier-tree-head">
              <span className="tier-tree-badge">{s.tier}</span>
              <strong>{s.method}</strong>
            </div>
            <p>
              <b>Data needed:</b> {s.dataNeeded}
            </p>
            <p className="tier-tree-fallback">
              <b>If missing:</b> {s.ifMissing}
            </p>
          </li>
        ))}
      </ol>
    </div>
  )
}
