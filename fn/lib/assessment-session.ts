import { SUSTALLY_API_URL, type AssessmentType } from './assessment-api'

export type AssessmentSession = {
  assessmentId: string
  assessmentType: AssessmentType
  email: string
  name?: string
  company?: string
  mobile?: string
  sector?: string
  natureOfBusiness?: string
  country?: string
  siteCount?: string
  conditionalApproach?: string
  status?: string
  assignmentDate?: string
  assignmentTime?: string
}

export type ValidatedAssessment = AssessmentSession & {
  id: string
  assessmentLink?: string
  rejectionReason?: string
}

const SESSION_KEY = 'assessmentSession'

export function loadAssessmentSession(): AssessmentSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AssessmentSession
  } catch {
    return null
  }
}

export function saveAssessmentSession(session: AssessmentSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export async function validateAssessment(
  assessmentId: string,
  email: string,
): Promise<
  | { success: true; assessment: ValidatedAssessment }
  | { success: false; error: string; status?: number }
> {
  try {
    const res = await fetch(
      `${SUSTALLY_API_URL}/api/assessments/validate?assessmentId=${encodeURIComponent(assessmentId)}&email=${encodeURIComponent(email.trim().toLowerCase())}`,
    )
    const json = await res.json()
    if (!res.ok || !json.success) {
      return {
        success: false,
        error: json.error || 'Assessment not found',
        status: res.status,
      }
    }
    const a = json.assessment
    const session: ValidatedAssessment = {
      id: a.id,
      assessmentId: a.assessmentId,
      assessmentType: a.assessmentType,
      email: a.email,
      name: a.name,
      company: a.company,
      mobile: a.mobile,
      sector: a.sector,
      natureOfBusiness: a.natureOfBusiness,
      country: a.country,
      siteCount: a.siteCount,
      conditionalApproach: a.conditionalApproach,
      status: a.status,
      assignmentDate: a.assignmentDate,
      assignmentTime: a.assignmentTime,
      assessmentLink: a.assessmentLink,
      rejectionReason: a.rejectionReason,
    }
    saveAssessmentSession(session)
    return { success: true, assessment: session }
  } catch {
    return { success: false, error: 'Could not verify assessment. Check your connection.' }
  }
}

/** Build query string for Scope 2 form from session + URL params */
export function scope2SearchParams(
  session: AssessmentSession,
  extra?: URLSearchParams,
): URLSearchParams {
  const params = new URLSearchParams(extra?.toString() || '')
  params.set('assessmentId', session.assessmentId)
  params.set('email', session.email)
  if (session.name) params.set('name', session.name)
  if (session.mobile) params.set('mobile', session.mobile)
  if (session.company) params.set('company', session.company)
  if (session.sector) params.set('sector', session.sector)
  if (session.natureOfBusiness) params.set('natureOfBusiness', session.natureOfBusiness)
  if (session.country) params.set('country', session.country)
  if (session.siteCount) params.set('siteCount', session.siteCount)
  if (session.conditionalApproach) params.set('conditionalApproach', session.conditionalApproach)
  if (session.assignmentDate) params.set('assignmentDate', session.assignmentDate)
  if (session.assignmentTime) params.set('assignmentTime', session.assignmentTime)
  return params
}
