'use client'

import { Moon, Sun } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

import { WizardStickyChrome } from '@/components/wizard-shared'
import { WizardProgressNav } from '@/components/wizard-progress-nav'

export const BOOKING_STEPS = ['Your details', 'Assessment type', 'Choose slot'] as const

export type BookingStep = 1 | 2 | 3

export { useWizardTheme } from '@/lib/use-wizard-theme'

export function BookingWizardShell({
  children,
  step,
  theme,
  onThemeToggle,
  productLabel = 'Assessment booking',
  onStepGo,
}: {
  children: ReactNode
  step: BookingStep
  theme: 'light' | 'dark'
  onThemeToggle: () => void
  productLabel?: string
  onStepGo?: (target: number) => void
}) {
  const router = useRouter()

  const canReach = (target: number) => target <= step
  const onGo =
    onStepGo ??
    ((target: number) => {
      if (target === 1) router.push('/')
      else if (target === 2 && step >= 2) router.push('/choose-assessment')
      else if (target === 3 && step >= 3) router.push('/choose-time')
    })

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
                <span className="brand-eyebrow">GHG Calculator</span>
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
          steps={[...BOOKING_STEPS]}
          step={step}
          canReach={canReach}
          onGo={onGo}
          gate={{
            orgValid: true,
            facilityValid: true,
            hasResult: false,
          }}
        />
      </WizardStickyChrome>

      <section className="wizard-main">{children}</section>
    </main>
  )
}
