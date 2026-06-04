import { SUSTALLY_API_URL as API_URL } from './api-url'

export type ResolvedApplication = {
  scope: 'SCOPE_1' | 'SCOPE_2'
  doc: Record<string, unknown>
  applicationId: string
}

async function fetchJson(path: string): Promise<{ ok: boolean; data: Record<string, unknown> | null }> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) return { ok: false, data: null }
    return { ok: true, data: (await res.json()) as Record<string, unknown> }
  } catch {
    return { ok: false, data: null }
  }
}

async function findScope1ApplicationByAssessmentId(
  scope1AssessmentId: string,
): Promise<Record<string, unknown> | null> {
  const query = new URLSearchParams({
    'where[scope1Assessment][equals]': scope1AssessmentId,
    limit: '1',
  })
  const res = await fetch(`${API_URL}/api/scope1-applications?${query.toString()}`, {
    cache: 'no-store',
  })
  if (!res.ok) return null
  const json = (await res.json()) as { docs?: Record<string, unknown>[] }
  return json.docs?.[0] ?? null
}

/**
 * Resolve a review tab id to a scope2- or scope1-applications document.
 * Supports legacy links that pass scope1-assessments id instead of application id.
 */
export async function resolveApplicationForReview(
  id: string,
  scopeHint?: 'SCOPE_1' | 'SCOPE_2' | null,
): Promise<ResolvedApplication | null> {
  if (!id) return null

  const tryScope1 = scopeHint !== 'SCOPE_2'
  const tryScope2 = scopeHint !== 'SCOPE_1'

  if (tryScope1) {
    const direct = await fetchJson(`/api/scope1-applications/${id}`)
    if (direct.ok && direct.data) {
      return {
        scope: 'SCOPE_1',
        doc: direct.data,
        applicationId: String(direct.data.id ?? id),
      }
    }

    const assessment = await fetchJson(`/api/scope1-assessments/${id}`)
    if (assessment.ok && assessment.data) {
      const linked = await findScope1ApplicationByAssessmentId(id)
      if (linked) {
        return {
          scope: 'SCOPE_1',
          doc: linked,
          applicationId: String(linked.id ?? id),
        }
      }
      return {
        scope: 'SCOPE_1',
        doc: {
          ...assessment.data,
          facilityName:
            (assessment.data.inputPayload as { facility?: { name?: string } })?.facility
              ?.name || assessment.data.name,
          inventoryName: assessment.data.name,
          status:
            assessment.data.reviewStatus === 'approved'
              ? 'APPROVED'
              : assessment.data.reviewStatus === 'rejected'
                ? 'REJECTED'
                : 'PENDING',
          _legacyAssessmentOnly: true,
        },
        applicationId: id,
      }
    }
  }

  if (tryScope2) {
    const scope2 = await fetchJson(`/api/scope2-applications/${id}`)
    if (scope2.ok && scope2.data) {
      return {
        scope: 'SCOPE_2',
        doc: scope2.data,
        applicationId: String(scope2.data.id ?? id),
      }
    }
  }

  return null
}

export function getAdminDashboardBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_URL || 'http://localhost:3002'
}

export function buildReviewUrl(applicationId: string, scope: 'SCOPE_1' | 'SCOPE_2'): string {
  const base = getAdminDashboardBaseUrl().replace(/\/$/, '')
  return scope === 'SCOPE_1'
    ? `${base}/assessment/${applicationId}?scope=1`
    : `${base}/assessment/${applicationId}`
}
