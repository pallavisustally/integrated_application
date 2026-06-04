/** Backend (sustally) base URL without trailing slash. */
export function getSustallyApiUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SUSTALLY_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.SUSTALLY_API_URL ||
    'http://localhost:3001'
  return raw.replace(/\/+$/, '')
}

export const SUSTALLY_API_URL = getSustallyApiUrl()
