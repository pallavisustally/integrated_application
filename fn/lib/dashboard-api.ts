export const DASHBOARD_API_URL =
  process.env.NEXT_PUBLIC_SUSTALLY_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001'

export type DashboardScope = 'SCOPE_1' | 'SCOPE_2'

export function usesUnifiedAssessmentOtp(assessmentId: string | null | undefined): boolean {
  return !!assessmentId?.trim()
}

function legacyOtpCollection(scope?: DashboardScope | null): 'scope1-applications' | 'scope2-applications' {
  return scope === 'SCOPE_1' ? 'scope1-applications' : 'scope2-applications'
}

export async function generateDashboardOtp(
  email: string,
  assessmentId?: string,
  scope?: DashboardScope,
) {
  const normalizedEmail = email.trim().toLowerCase()
  if (usesUnifiedAssessmentOtp(assessmentId)) {
    return fetch(`${DASHBOARD_API_URL}/api/assessments/generate-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, assessmentId: assessmentId!.trim() }),
    })
  }
  const collection = legacyOtpCollection(scope)
  return fetch(`${DASHBOARD_API_URL}/api/${collection}/generate-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalizedEmail }),
  })
}

export async function verifyDashboardOtp(
  email: string,
  otp: string,
  assessmentId?: string,
  scope?: DashboardScope,
) {
  const normalizedEmail = email.trim().toLowerCase()
  if (usesUnifiedAssessmentOtp(assessmentId)) {
    return fetch(`${DASHBOARD_API_URL}/api/assessments/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizedEmail,
        otp: otp.trim(),
        assessmentId: assessmentId!.trim(),
      }),
    })
  }
  const collection = legacyOtpCollection(scope)
  return fetch(`${DASHBOARD_API_URL}/api/${collection}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalizedEmail, otp: otp.trim() }),
  })
}
