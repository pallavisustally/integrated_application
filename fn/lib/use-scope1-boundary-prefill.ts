'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { loadAssessmentSession } from '@/lib/assessment-session'
import { mapBookingConsolidationToScope1 } from '@/lib/assessment-mapper'

type BoundaryShape = {
  boundaryMethod?: string
}

/** Apply booking consolidation approach to wizard boundary fields once on mount. */
export function useScope1BoundaryPrefill<T extends { organizationBoundary: BoundaryShape }>(
  patch: (mut: (draft: T) => void) => void,
) {
  const searchParams = useSearchParams()
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    const session = loadAssessmentSession()
    const fromUrl = searchParams.get('conditionalApproach')
    const method = mapBookingConsolidationToScope1(fromUrl || session?.conditionalApproach)
    if (!method) return
    done.current = true
    patch((d) => {
      d.organizationBoundary.boundaryMethod = method
    })
  }, [searchParams, patch])
}
