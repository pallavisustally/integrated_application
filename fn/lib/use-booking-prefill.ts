'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { loadAssessmentSession } from '@/lib/assessment-session'
import {
  organizationPrefillFromSearchParams,
  organizationPrefillFromSession,
  type OrganizationPrefill,
} from '@/lib/assessment-mapper'

/** Apply booking URL + session to organization fields once per mount. */
export function useBookingPrefill(apply: (fields: OrganizationPrefill) => void) {
  const searchParams = useSearchParams()
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    const fromUrl = organizationPrefillFromSearchParams(searchParams)
    const fromSession = organizationPrefillFromSession(loadAssessmentSession())
    const merged: OrganizationPrefill = { ...fromSession, ...fromUrl }
    if (!Object.keys(merged).length) return
    done.current = true
    apply(merged)
  }, [searchParams, apply])
}
