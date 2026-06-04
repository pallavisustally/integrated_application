import type { Payload } from 'payload'

import {
  buildAssessmentRetryLink,
  type AssessmentType,
} from './assessment-utils'
import { generateScope1Reports } from './dashboard/scope1-generator'
import { sendAssessmentApprovalEmail, sendScope1RejectionEmail } from './email'

export async function onScope1Approved(
  cms: Payload,
  scope1Doc: {
    id: string
    assessmentId?: string
    sectorCode: 'CEMENT' | 'OIL_GAS' | 'PULP_PAPER' | 'POWER' | 'IRON_STEEL'
    inputPayload: unknown
    result?: unknown
    name?: string
  },
  parent: {
    id: string
    email?: string | null
    name?: string | null
    company?: string | null
    assessmentId?: string
  },
): Promise<void> {
  const publicId = scope1Doc.assessmentId || parent.assessmentId
  if (!publicId) return

  const urls = await generateScope1Reports(cms, {
    id: String(scope1Doc.id),
    sectorCode: scope1Doc.sectorCode,
    inputPayload: scope1Doc.inputPayload,
    result: scope1Doc.result,
    assessmentId: publicId,
  })

  await cms.update({
    collection: 'scope1-assessments',
    id: scope1Doc.id,
    data: {
      reportUrl: urls.reportUrl,
      dashboardUrl: urls.dashboardUrl,
    },
  })

  if (parent.email) {
    await sendAssessmentApprovalEmail(parent.email, {
      assessmentId: publicId,
      assessmentType: 'SCOPE_1',
      name: parent.name || scope1Doc.name || undefined,
      company: parent.company || undefined,
    })
  }
}

export async function onScope1Rejected(
  cms: Payload,
  scope1Doc: { name?: string; assessmentId?: string },
  parent: {
    email?: string | null
    assessmentType?: AssessmentType | null
    assessmentId?: string
  },
  reason?: string,
): Promise<void> {
  const email = parent.email
  if (!email || !parent.assessmentId) return

  const retryLink = buildAssessmentRetryLink(
    parent.assessmentId,
    email,
    parent.assessmentType === 'SCOPE_2' ? 'SCOPE_2' : 'SCOPE_1',
  )

  await sendScope1RejectionEmail(email, scope1Doc.name || 'Scope 1 inventory', reason, retryLink)
}
