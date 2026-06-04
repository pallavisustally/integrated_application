/**
 * Shared helpers for unified assessment booking (Scope 1 + Scope 2).
 */

import { getFnAppUrl } from './app-urls'

export type AssessmentType = 'SCOPE_1' | 'SCOPE_2'

export type AssessmentStatus =
  | 'BOOKED'
  | 'INVITED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'

export function generateAssessmentId(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

export function buildAssessmentStartLink(assessmentId: string, email: string): string {
  const base = getFnAppUrl()
  const params = new URLSearchParams({
    assessmentId,
    email: email.trim().toLowerCase(),
  })
  return `${base}/assessment/start?${params.toString()}`
}

/** Retry link after rejection (same assessment id, opens form with retry flag). */
export function buildAssessmentRetryLink(
  assessmentId: string,
  email: string,
  assessmentType: AssessmentType,
): string {
  const base = getFnAppUrl()
  const params = new URLSearchParams({
    assessmentId,
    email: email.trim().toLowerCase(),
    retry: 'true',
  })
  const path = assessmentType === 'SCOPE_1' ? '/scope1' : '/scope'
  return `${base}${path}?${params.toString()}`
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export type ConsolidationApproach =
  | 'Operational Control'
  | 'Equity Share'
  | 'Financial Control'

const CONSOLIDATION_APPROACHES: ConsolidationApproach[] = [
  'Operational Control',
  'Equity Share',
  'Financial Control',
]

/** Coerce API/booking input to a valid assessments.conditionalApproach value. */
export function parseConsolidationApproach(
  value?: string | null,
  fallback: ConsolidationApproach = 'Operational Control',
): ConsolidationApproach {
  if (value && CONSOLIDATION_APPROACHES.includes(value as ConsolidationApproach)) {
    return value as ConsolidationApproach
  }
  return fallback
}
