'use client'

import { Scale } from 'lucide-react'

export type GwpOption = {
  key: string
  label: string
  title?: string
  hint?: string
}

function gwpCardHint(option: GwpOption): string {
  if (option.hint) return option.hint
  if (option.key === 'AR6_20') return '20-year time horizon'
  return '100-year time horizon'
}

/** GWP choices as sector-style cards inside the step-1 sector grid. */
export function GwpSectorCards({
  value,
  options,
  onChange,
  beforeChange,
}: {
  value: string
  options: GwpOption[]
  onChange: (key: string) => void
  beforeChange?: (nextKey: string) => boolean | Promise<boolean>
}) {
  const pick = async (key: string) => {
    if (key === value) return
    if (beforeChange) {
      const ok = await beforeChange(key)
      if (!ok) return
    }
    onChange(key)
  }

  return (
    <div className="sector-gwp-section">
      <div className="sector-grid-gwp-label">
        <strong>GWP setting</strong>
        <span>How CH₄ and N₂O convert to CO₂e for this inventory</span>
      </div>
      <div className="sector-gwp-row">
        {options.map((g) => (
          <button
            key={g.key}
            type="button"
            className={`sector-card sector-card-gwp${value === g.key ? ' selected' : ''}`}
            title={g.title ?? g.label}
            aria-pressed={value === g.key}
            onClick={() => pick(g.key)}
          >
            <span className="icon">
              <Scale size={22} strokeWidth={1.75} />
            </span>
            <strong>{g.label}</strong>
            <small>{gwpCardHint(g)}</small>
            <span className="tags">IPCC · GWP</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export const GWP_OPTIONS_TWO: GwpOption[] = [
  { key: 'AR5', label: 'AR5 (100 yr)', title: 'IPCC AR5, 100-year time horizon' },
  { key: 'AR6', label: 'AR6 (100 yr)', title: 'IPCC AR6, 100-year time horizon' },
]

export const GWP_OPTIONS_THREE: GwpOption[] = [
  { key: 'AR5_100', label: 'AR5 (100 yr)', title: 'IPCC AR5, 100-year time horizon' },
  { key: 'AR6_100', label: 'AR6 (100 yr)', title: 'IPCC AR6, 100-year time horizon' },
  { key: 'AR6_20', label: 'AR6 (20 yr)', title: 'IPCC AR6, 20-year time horizon', hint: '20-year time horizon' },
]
