import type { Payload } from 'payload'
import type { Scope1Application } from '@/payload-types'

import { scope1SnapshotFromAssessment } from './scope1-user-payload'
import { sendScope1AdminNotification, type Scope1Submission } from './email'

type Scope1AssessmentDoc = {
  id: string
  assessmentId?: string | null
  assessment?: string | number | null
  name?: string | null
  sectorCode?: string | null
  reportingYear?: number | null
  grossScope1Tonnes?: number | null
  gwpSet?: string | null
  inputPayload?: unknown
  result?: unknown
  reportUrl?: string | null
  submittedAt?: string | null
}

async function resolveParentAssessment(
  cms: Payload,
  scope1Doc: Scope1AssessmentDoc,
): Promise<{
  parentId?: string
  email?: string
  name?: string
  company?: string
  mobile?: string
}> {
  if (scope1Doc.assessment) {
    const parentId = String(scope1Doc.assessment)
    try {
      const parent = await cms.findByID({
        collection: 'assessments',
        id: parentId,
        depth: 0,
      })
      return {
        parentId,
        email: parent.email || undefined,
        name: parent.name || undefined,
        company: parent.company || undefined,
        mobile: parent.mobile || undefined,
      }
    } catch {
      // fall through to lookup by public id
    }
  }

  const publicId = scope1Doc.assessmentId
  if (!publicId) return {}

  const parents = await cms.find({
    collection: 'assessments',
    where: { assessmentId: { equals: publicId } },
    limit: 1,
  })
  if (parents.totalDocs === 0) return {}

  const parent = parents.docs[0]
  return {
    parentId: String(parent.id),
    email: parent.email || undefined,
    name: parent.name || undefined,
    company: parent.company || undefined,
    mobile: parent.mobile || undefined,
  }
}

function facilityLabel(scope1Doc: Scope1AssessmentDoc): string {
  const payload = scope1Doc.inputPayload as { facility?: { name?: string } } | undefined
  return payload?.facility?.name || scope1Doc.name || 'Scope 1 facility'
}

/**
 * Create or refresh a scope1-applications row when an inventory is submitted for review.
 * Mirrors scope2-applications on Scope 2 form submit.
 */
export async function upsertScope1ApplicationForSubmission(
  cms: Payload,
  scope1AssessmentId: string,
): Promise<{ applicationId: string }> {
  const scope1Doc = (await cms.findByID({
    collection: 'scope1-assessments',
    id: scope1AssessmentId,
    depth: 0,
  })) as Scope1AssessmentDoc

  const parent = await resolveParentAssessment(cms, scope1Doc)
  const email = parent.email?.trim().toLowerCase()
  if (!email) {
    throw new Error('Parent assessment email is required to create a Scope 1 application record')
  }

  const applicationData = {
    assessmentId: scope1Doc.assessmentId || undefined,
    assessment: parent.parentId,
    scope1Assessment: scope1AssessmentId,
    email,
    userName: parent.name || undefined,
    userCompany: parent.company || undefined,
    userMobile: parent.mobile || undefined,
    facilityName: facilityLabel(scope1Doc),
    status: 'PENDING' as const,
    ...scope1SnapshotFromAssessment(scope1Doc),
  }

  const existing = await cms.find({
    collection: 'scope1-applications',
    where: { scope1Assessment: { equals: scope1AssessmentId } },
    limit: 1,
    overrideAccess: true,
  })

  let applicationId: string
  if (existing.totalDocs > 0) {
    await cms.update({
      collection: 'scope1-applications',
      id: existing.docs[0].id,
      data: applicationData,
      overrideAccess: true,
    })
    applicationId = String(existing.docs[0].id)
  } else {
    const created = await cms.create({
      collection: 'scope1-applications',
      data: applicationData,
      overrideAccess: true,
    })
    applicationId = String(created.id)
  }

  const submission: Scope1Submission = {
    id: applicationId,
    status: 'PENDING',
    submittedAt: new Date().toISOString(),
    data: {
      facilityName: applicationData.facilityName,
      inventoryName: applicationData.inventoryName,
      sectorCode: applicationData.sectorCode,
      reportingYear: applicationData.reportingYear,
      grossScope1Tonnes: applicationData.grossScope1Tonnes,
      email,
    },
  }
  await sendScope1AdminNotification(submission)

  return { applicationId }
}
