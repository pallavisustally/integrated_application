'use client'

import type { ReactNode } from 'react'

import type { Scope1ReviewQuadrants } from '@/lib/scope1-review-build'

import {
  BoundaryIcon,
  CalcIcon,
  EnergyIcon,
  ReviewCard,
  ReviewCardFields,
} from './review-primitives'

export function Scope1ReviewGridReadOnly({
  quadrants,
  header,
  footer,
}: {
  quadrants: Scope1ReviewQuadrants
  header?: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="w-full max-w-6xl flex flex-col h-full">
      {header}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0 pb-6">
        <ReviewCard title={quadrants.orgBoundary.title} icon={<BoundaryIcon />} accentColor={quadrants.orgBoundary.accentColor}>
          <ReviewCardFields fields={quadrants.orgBoundary.fields} />
        </ReviewCard>
        <ReviewCard title={quadrants.activity.title} icon={<EnergyIcon />} accentColor={quadrants.activity.accentColor}>
          <ReviewCardFields fields={quadrants.activity.fields} />
        </ReviewCard>
        <ReviewCard title={quadrants.calcSummary.title} icon={<CalcIcon />} accentColor={quadrants.calcSummary.accentColor}>
          <ReviewCardFields fields={quadrants.calcSummary.fields} />
        </ReviewCard>
        <ReviewCard title={quadrants.calcBreakdown.title} icon={<CalcIcon />} accentColor={quadrants.calcBreakdown.accentColor}>
          <ReviewCardFields fields={quadrants.calcBreakdown.fields} />
        </ReviewCard>
      </div>
      {footer}
    </div>
  )
}
