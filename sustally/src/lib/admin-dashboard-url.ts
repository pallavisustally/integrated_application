import {
  getAdminDashboardUrl,
  getFnAppUrl,
} from './app-urls'

export type AdminReviewScope = 'SCOPE_1' | 'SCOPE_2'

/**
 * Base URL for the standalone admin dashboard app (admin_dashboard/, port 3002 locally).
 * Do not use the fn app URL with /admin_dashboard — that route is only a placeholder.
 */
export function getAdminDashboardBaseUrl(): string {
  return getAdminDashboardUrl()
}

/**
 * User-facing fn app — used for /admin/review when ADMIN_REVIEW_USE_FN=true.
 */
export function getFnAppBaseUrl(): string {
  return getFnAppUrl()
}

export function buildAdminAssessmentReviewUrl(
  applicationId: string,
  scope: AdminReviewScope,
): string {
  if (process.env.ADMIN_REVIEW_USE_FN === 'true') {
    const type = scope === 'SCOPE_1' ? 'scope1' : 'scope2'
    return `${getFnAppBaseUrl()}/admin/review/${applicationId}?type=${type}`
  }

  const base = getAdminDashboardBaseUrl()
  const query = scope === 'SCOPE_1' ? '?scope=1' : ''
  return `${base}/assessment/${applicationId}${query}`
}
