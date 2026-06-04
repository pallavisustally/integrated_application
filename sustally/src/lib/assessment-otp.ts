import type { Payload } from 'payload'

import { normalizeEmail } from './assessment-utils'

export function generateSixDigitOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function otpExpiresAt(): string {
  return new Date(Date.now() + 10 * 60 * 1000).toISOString()
}

export async function findAssessmentByIdAndEmail(
  cms: Payload,
  assessmentId: string,
  email: string,
) {
  const result = await cms.find({
    collection: 'assessments',
    where: {
      and: [
        { assessmentId: { equals: assessmentId } },
        { email: { equals: normalizeEmail(email) } },
      ],
    },
    limit: 1,
    overrideAccess: true,
    showHiddenFields: true,
  })
  return result.totalDocs > 0 ? result.docs[0] : null
}

export function otpIsValid(
  storedOtp: unknown,
  storedExpires: unknown,
  submittedOtp: string,
): boolean {
  const otp = String(storedOtp || '').trim()
  if (otp !== submittedOtp.trim()) return false
  if (!storedExpires) return false
  return new Date(String(storedExpires)) >= new Date()
}
