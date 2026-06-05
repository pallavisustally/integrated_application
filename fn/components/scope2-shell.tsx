'use client'

import { Moon, Sun } from 'lucide-react'
import type { ReactNode } from 'react'

import { WizardStickyChrome } from '@/components/wizard-shared'
import { WizardProgressNav } from '@/components/wizard-progress-nav'

export const SCOPE2_STEPS = ['Boundaries', 'Energy inputs', 'Review & submit'] as const

export function Scope2WizardShell({
  children,
  step,
  theme,
  onThemeToggle,
  onStepGo,
  canReachStep,
  productLabel = 'Grid electricity',
}: {
  children: ReactNode
  step: 1 | 2 | 3
  theme: 'light' | 'dark'
  onThemeToggle: () => void
  onStepGo?: (target: number) => void
  canReachStep?: (target: number) => boolean
  productLabel?: string
}) {
  const canReach = canReachStep ?? ((target: number) => target <= step)
  const onGo = onStepGo ?? (() => {})

  return (
    <main className={theme === 'dark' ? 'wizard-app dark' : 'wizard-app'}>
      <WizardStickyChrome>
        <header className="wizard-header">
          <div className="wizard-header-inner">
            <div className="wizard-brand">
              <img
                className="brand-logo"
                src={theme === 'dark' ? '/brand/typemark-white.svg' : '/brand/typemark-black.svg'}
                alt="Sustally"
              />
              <span className="brand-divider" />
              <span className="brand-label">
                <span className="brand-eyebrow">Scope 2 Calculator</span>
                <span className="brand-product">{productLabel}</span>
              </span>
            </div>
            <div className="wizard-actions">
              <button
                type="button"
                className="theme-switch"
                onClick={onThemeToggle}
                title="Toggle theme"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            </div>
          </div>
        </header>

        <WizardProgressNav
          steps={[...SCOPE2_STEPS]}
          step={step}
          canReach={canReach}
          onGo={onGo}
          gate={{
            orgValid: true,
            facilityValid: true,
            hasResult: step >= 3,
          }}
        />
      </WizardStickyChrome>

      <section className="wizard-main">{children}</section>
    </main>
  )
}
