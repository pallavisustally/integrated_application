import type { Scope1Application } from '@/payload-types'

type Scope1AssessmentLike = {
  id?: string
  assessmentId?: string | null
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

type AssessmentLike = {
  assessmentId?: string | null
  email?: string | null
  name?: string | null
  company?: string | null
  sector?: string | null
}

/** Snapshot fields copied from scope1-assessments onto scope1-applications (mirrors Scope 2 flat storage). */
export function scope1SnapshotFromAssessment(
  scope1Doc: Scope1AssessmentLike,
): Pick<
  Scope1Application,
  | 'grossScope1Tonnes'
  | 'gwpSet'
  | 'inputPayload'
  | 'result'
  | 'reportUrl'
  | 'submittedAt'
  | 'sectorCode'
  | 'reportingYear'
  | 'inventoryName'
> {
  return {
    grossScope1Tonnes: scope1Doc.grossScope1Tonnes ?? undefined,
    gwpSet: scope1Doc.gwpSet ?? undefined,
    inputPayload: (scope1Doc.inputPayload ?? undefined) as Scope1Application['inputPayload'],
    result: (scope1Doc.result ?? undefined) as Scope1Application['result'],
    reportUrl: scope1Doc.reportUrl ?? undefined,
    submittedAt: scope1Doc.submittedAt ?? undefined,
    sectorCode: (scope1Doc.sectorCode ?? undefined) as Scope1Application['sectorCode'],
    reportingYear: scope1Doc.reportingYear ?? undefined,
    inventoryName: scope1Doc.name ?? undefined,
  }
}

/** Session/dashboard user object — aligned with buildScope2User field naming. */
export function buildScope1UserPayload(
  application: Scope1Application,
  scope1Doc: Scope1AssessmentLike | null,
  assessment?: AssessmentLike | null,
) {
  const inputPayload =
    (application.inputPayload as Record<string, unknown> | undefined) ??
    (scope1Doc?.inputPayload as Record<string, unknown> | undefined)

  const facilityName =
    application.facilityName ||
    (inputPayload?.facility as { name?: string } | undefined)?.name ||
    scope1Doc?.name ||
    'Your facility'

  const userCompany = application.userCompany || assessment?.company || undefined

  return {
    id: application.id,
    applicationId: application.id,
    facilityName,
    userCompany,
    email: application.email || assessment?.email,
    userName: application.userName || assessment?.name || scope1Doc?.name,
    sector: assessment?.sector ?? undefined,
    sectorCode: application.sectorCode || scope1Doc?.sectorCode,
    reportingYear: application.reportingYear ?? scope1Doc?.reportingYear,
    grossScope1Tonnes: application.grossScope1Tonnes ?? scope1Doc?.grossScope1Tonnes,
    gwpSet: application.gwpSet ?? scope1Doc?.gwpSet,
    assessmentId: application.assessmentId || assessment?.assessmentId || scope1Doc?.assessmentId,
    calculationId: scope1Doc?.id,
    reportUrl: application.reportUrl ?? scope1Doc?.reportUrl,
    inputPayload: application.inputPayload ?? scope1Doc?.inputPayload,
    result: application.result ?? scope1Doc?.result,
    submittedAt: application.submittedAt ?? scope1Doc?.submittedAt,
    // Legacy aliases used by existing dashboard UI
    name: application.userName || assessment?.name || scope1Doc?.name,
    company: userCompany,
  }
}
