/** Scope 1 calculation API client (sustally backend). */

import { SUSTALLY_API_URL as SCOPE1_API_URL } from './api-url'

export { SCOPE1_API_URL }

export function scope1Api(path: string): string {
  const base = SCOPE1_API_URL
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

export function scope1Fetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(scope1Api(path), init)
}

export function getScope1AssessmentId(): string | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const raw = sessionStorage.getItem('assessmentSession')
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as { assessmentId?: string }
    return parsed.assessmentId?.trim() || undefined
  } catch {
    return undefined
  }
}

/** Query string for optional persist on calculate routes */
export function scope1SaveQuery(save: boolean): string {
  if (!save) return ''
  const id = getScope1AssessmentId()
  if (id) return `?save=true&assessmentId=${encodeURIComponent(id)}`
  return '?save=true'
}

export async function calculateCement(payload: unknown) {
  const res = await scope1Fetch('/api/v1/calculations/cement/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function fetchFactors(sector: string) {
  const res = await scope1Fetch(`/api/v1/factors?sector=${encodeURIComponent(sector)}`)
  return res.json()
}
