export type AssessmentType = 'SCOPE_1' | 'SCOPE_2'

export const SUSTALLY_API_URL =
  process.env.NEXT_PUBLIC_SUSTALLY_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001'

export type BookAssessmentPayload = {
  assessmentType: AssessmentType
  email: string
  name?: string
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

export type BookedAssessment = {
  id: string
  assessmentId: string
  assessmentType: AssessmentType
  status: string
  assessmentLink: string
  email: string
}

export async function bookAssessment(
  payload: BookAssessmentPayload,
): Promise<{ success: true; assessment: BookedAssessment } | { success: false; error: string }> {
  try {
    const res = await fetch(`${SUSTALLY_API_URL}/api/assessments/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || 'Booking failed' }
    }
    return { success: true, assessment: json.assessment as BookedAssessment }
  } catch {
    return { success: false, error: 'Could not reach the server. Please try again.' }
  }
}
