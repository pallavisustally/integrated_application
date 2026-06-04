/** Strip trailing slashes and surrounding whitespace from a base URL. */
export function normalizeBaseUrl(url: string | undefined | null): string {
  return (url ?? '').trim().replace(/\/+$/, '')
}

/** User-facing fn app — booking, assessments, dashboard links in emails. */
export function getFnAppUrl(): string {
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL) || 'http://localhost:3000'
}

/** This sustally deployment (API + Payload admin). */
export function getServerUrl(): string {
  return normalizeBaseUrl(process.env.PAYLOAD_PUBLIC_SERVER_URL) || 'http://localhost:3001'
}

/** Standalone admin dashboard (admin_dashboard/). */
export function getAdminDashboardUrl(): string {
  return normalizeBaseUrl(process.env.ADMIN_DASHBOARD_URL) || 'http://localhost:3002'
}

const DEFAULT_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3002',
  'https://sustally.vercel.app',
  'https://new-rho-plum.vercel.app',
  'https://integrated-application-fn.vercel.app',
  'https://integrated-application-7zao.vercel.app',
]

function parseOriginList(raw: string | undefined): string[] {
  if (!raw?.trim()) return []
  return raw.split(',').map((origin) => normalizeBaseUrl(origin)).filter(Boolean)
}

/** Browser origins allowed for cross-origin API requests. */
export function getAllowedCorsOrigins(): string[] {
  const fromEnv = parseOriginList(process.env.CORS_ORIGINS)
  const derived = [getFnAppUrl(), getServerUrl(), getAdminDashboardUrl()].filter(Boolean)
  return [...new Set([...fromEnv, ...derived, ...DEFAULT_CORS_ORIGINS])]
}

export function isAllowedCorsOrigin(origin: string | null | undefined): boolean {
  if (!origin) return false
  return getAllowedCorsOrigins().includes(normalizeBaseUrl(origin))
}
