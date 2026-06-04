import configPromise from '@payload-config'
import { getPayload } from 'payload'

import {
  findAssessmentByIdAndEmail,
  generateSixDigitOtp,
  otpExpiresAt,
} from '../../../../../lib/assessment-otp'
import { normalizeEmail } from '../../../../../lib/assessment-utils'
import { corsHeaders, jsonResponse } from '../../../../../lib/cors'

export const OPTIONS = async (request: Request) => {
  return new Response(null, { status: 200, headers: corsHeaders(request) })
}

export const POST = async (request: Request) => {
  try {
    const body = await request.json()
    const email = normalizeEmail(
      typeof body.email === 'string' ? body.email : String(body.email || ''),
    )
    const assessmentId = (
      typeof body.assessmentId === 'string' ? body.assessmentId : ''
    ).trim()

    if (!email || !assessmentId) {
      return jsonResponse(
        request,
        { error: 'email and assessmentId are required' },
        400,
      )
    }

    const payload = await getPayload({ config: configPromise })
    const assessment = await findAssessmentByIdAndEmail(payload, assessmentId, email)

    if (!assessment) {
      return jsonResponse(request, { error: 'Assessment not found' }, 404)
    }

    if (assessment.status !== 'APPROVED') {
      return jsonResponse(
        request,
        { error: 'Assessment pending or rejected. Please contact admin.' },
        403,
      )
    }

    const otp = generateSixDigitOtp()
    const expires = otpExpiresAt()

    await payload.update({
      collection: 'assessments',
      id: assessment.id,
      data: { otp, otpExpiresAt: expires },
      overrideAccess: true,
    })

    try {
      await payload.sendEmail({
        to: email,
        subject: 'Your Sustally dashboard login OTP',
        html: `<p>Your OTP for dashboard access is: <strong>${otp}</strong></p><p>This OTP expires in 10 minutes.</p>`,
      })
    } catch (err) {
      console.error('[assessments/generate-otp] Email failed:', err)
    }

    return jsonResponse(request, { success: true, message: 'OTP sent to email' })
  } catch (error) {
    console.error('[assessments/generate-otp]', error)
    return jsonResponse(request, { error: 'Internal server error' }, 500)
  }
}
