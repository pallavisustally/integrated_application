'use client'

import { useCallback } from 'react'

import { applyOrganizationPrefill, type OrganizationPrefill } from '@/lib/assessment-mapper'
import { useBookingPrefill } from '@/lib/use-booking-prefill'

type OrgShape = {
  name?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  contactRole?: string
  country?: string
}

/** Wire booking session/URL into wizard organization fields once on mount. */
export function useScope1OrganizationPrefill<T extends { organization: OrgShape }>(
  patch: (mut: (draft: T) => void) => void,
  mapCountry?: (country: string) => string,
) {
  const applyPrefill = useCallback(
    (fields: OrganizationPrefill) => {
      const next = { ...fields }
      if (next.country && mapCountry) {
        next.country = mapCountry(next.country)
      }
      patch((d) => applyOrganizationPrefill(d.organization, next))
    },
    [patch, mapCountry],
  )
  useBookingPrefill(applyPrefill)
}
