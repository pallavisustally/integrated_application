'use client'

import type { CSSProperties } from 'react'

import { wizardStepLockReason, type WizardGateContext } from '@/lib/ui/wizard-stepper'

export function WizardProgressNav({
  steps,
  step,
  canReach,
  onGo,
  gate,
}: {
  steps: string[]
  step: number
  canReach: (target: number) => boolean
  onGo: (target: number) => void
  gate: WizardGateContext
}) {
  return (
    <nav
      className="wizard-progress"
      aria-label="Inventory steps"
      style={{ '--step-count': steps.length } as CSSProperties}
    >
      {steps.map((label, i) => {
        const target = i + 1
        const reachable = canReach(target)
        const locked = !reachable && target !== step
        const lockReason = locked ? wizardStepLockReason(target, gate) : undefined
        return (
          <button
            key={label}
            type="button"
            className={[
              step === target ? 'active' : '',
              step > target ? 'complete' : '',
              locked ? 'wizard-step-locked' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onGo(target)}
            disabled={locked}
            aria-disabled={locked || undefined}
            title={lockReason}
          >
            <span>{target}</span>
            <b>{label}</b>
            {lockReason ? <em className="wizard-step-lock-hint">{lockReason}</em> : null}
          </button>
        )
      })}
    </nav>
  )
}
