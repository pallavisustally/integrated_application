import configPromise from '@payload-config'
import { getPayload, APIError } from 'payload'
import type { AssessmentType } from '../../../../../lib/assessment-utils'
import { generateAssessmentId, normalizeEmail } from '../../../../../lib/assessment-utils'
import { corsHeaders, jsonResponse } from '../../../../../lib/cors'

export const OPTIONS = async (request: Request) => {
  return new Response(null, { status: 200, headers: corsHeaders(request) })
}

type BookBody = {
  assessmentType: AssessmentType
  name?: string
  email: string
  mobile?: string
  company?: string
  sector?: string
  natureOfBusiness?: string
  country?: string
  legalEntityId?: string
  siteCount?: string
  siteCountNumber?: string
  conditionalApproach?: string
  assignmentDate?: string
  assignmentSlot?: string
  assignmentTime?: string
}

export const POST = async (request: Request) => {
  try {
    const payload = await getPayload({ config: configPromise })
    const body = (await request.json()) as BookBody

    if (!body.email?.trim()) {
      throw new APIError('Email is required', 400)
    }
    if (body.assessmentType !== 'SCOPE_1' && body.assessmentType !== 'SCOPE_2') {
      throw new APIError('assessmentType must be SCOPE_1 or SCOPE_2', 400)
    }

    const email = normalizeEmail(body.email)

    const created = await payload.create({
      collection: 'assessments',
      data: {
        assessmentId: generateAssessmentId(),
        assessmentType: body.assessmentType,
        status: 'BOOKED',
        name: body.name || '',
        email,
        mobile: body.mobile || '',
        company: body.company || '',
        sector: body.sector || '',
        natureOfBusiness: body.natureOfBusiness || '',
        country: body.country || 'India',
        legalEntityId: body.legalEntityId || '',
        siteCount: body.siteCount || '',
        siteCountNumber: body.siteCountNumber || '',
        conditionalApproach: body.conditionalApproach || 'Operational Control',
        assignmentDate: body.assignmentDate || '',
        assignmentSlot: body.assignmentSlot || '',
        assignmentTime: body.assignmentTime || '',
        invitedAt: new Date().toISOString(),
      },
    })

    return jsonResponse(request, {
      success: true,
      assessment: {
        id: created.id,
        assessmentId: created.assessmentId,
        assessmentType: created.assessmentType,
        status: created.status,
        assessmentLink: created.assessmentLink,
        email: created.email,
      },
    })
  } catch (error) {
    console.error('[assessments/book]', error)
    const message = error instanceof APIError ? error.message : 'Failed to create assessment booking'
    const status = error instanceof APIError ? error.status : 500
    return jsonResponse(request, { success: false, error: message }, status)
  }
}
