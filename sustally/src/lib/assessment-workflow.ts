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
  options?: { applicantEmail?: string | null },
): Promise<void> {
  const publicId = scope1Doc.assessmentId || parent.assessmentId
  if (!publicId) {
    console.error('[onScope1Approved] Missing public assessmentId')
    return
  }

  const appBase = (await import('./app-urls')).getFnAppUrl()
  const dashboardUrl = `${appBase}/dashboard?email=${encodeURIComponent(
    (options?.applicantEmail || parent.email || '').trim().toLowerCase(),
  )}&assessmentId=${encodeURIComponent(publicId)}`

  try {
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
        dashboardUrl: urls.dashboardUrl || dashboardUrl,
      },
      context: { skipHooks: true },
    })
  } catch (err) {
    console.error('[onScope1Approved] Report generation failed (email will still be sent):', err)
    try {
      await cms.update({
        collection: 'scope1-assessments',
        id: scope1Doc.id,
        data: { dashboardUrl },
        context: { skipHooks: true },
      })
    } catch (updateErr) {
      console.error('[onScope1Approved] Failed to save dashboardUrl:', updateErr)
    }
  }

  const recipient = (options?.applicantEmail || parent.email || '').trim().toLowerCase()
  if (recipient) {
    await sendAssessmentApprovalEmail(recipient, {
      assessmentId: publicId,
      assessmentType: 'SCOPE_1',
      name: parent.name || scope1Doc.name || undefined,
      company: parent.company || undefined,
    })
  } else {
    console.error('[onScope1Approved] No applicant email — approval email not sent')
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
