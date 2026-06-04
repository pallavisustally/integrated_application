import configPromise from '@payload-config'
import { getPayload, APIError } from 'payload'
import { normalizeEmail } from '../../../../../lib/assessment-utils'
import { corsHeaders, jsonResponse } from '../../../../../lib/cors'

export const OPTIONS = async (request: Request) => {
  return new Response(null, { status: 200, headers: corsHeaders(request) })
}

export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url)
    const assessmentId = searchParams.get('assessmentId')?.trim()
    const emailParam = searchParams.get('email')?.trim()

    if (!assessmentId || !emailParam) {
      throw new APIError('assessmentId and email are required', 400)
    }

    const email = normalizeEmail(emailParam)
    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: 'assessments',
      where: {
        and: [
          { assessmentId: { equals: assessmentId } },
          { email: { equals: email } },
        ],
      },
      limit: 1,
    })

    if (result.totalDocs === 0) {
      return jsonResponse(request, { success: false, error: 'Assessment not found' }, 404)
    }

    const doc = result.docs[0]

    if (doc.status === 'BOOKED' || doc.status === 'INVITED') {
      await payload.update({
        collection: 'assessments',
        id: doc.id,
        data: { status: 'IN_PROGRESS' },
      })
      doc.status = 'IN_PROGRESS'
    }

    return jsonResponse(request, {
      success: true,
      assessment: {
        id: doc.id,
        assessmentId: doc.assessmentId,
        assessmentType: doc.assessmentType,
        status: doc.status,
        name: doc.name,
        email: doc.email,
        mobile: doc.mobile,
        company: doc.company,
        sector: doc.sector,
        natureOfBusiness: doc.natureOfBusiness,
        country: doc.country,
        legalEntityId: doc.legalEntityId,
        siteCount: doc.siteCount,
        siteCountNumber: doc.siteCountNumber,
        conditionalApproach: doc.conditionalApproach,
        assignmentDate: doc.assignmentDate,
        assignmentSlot: doc.assignmentSlot,
        assignmentTime: doc.assignmentTime,
        assessmentLink: doc.assessmentLink,
        rejectionReason: doc.rejectionReason,
      },
    })
  } catch (error) {
    console.error('[assessments/validate]', error)
    const message = error instanceof APIError ? error.message : 'Validation failed'
    const status = error instanceof APIError ? error.status : 500
    return jsonResponse(request, { success: false, error: message }, status)
  }
}
