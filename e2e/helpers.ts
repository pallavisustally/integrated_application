export const SUSTALLY_URL = process.env.SUSTALLY_BASE_URL || 'http://127.0.0.1:3001'
export const FN_URL = process.env.FN_BASE_URL || 'http://127.0.0.1:3000'

export const skipDbTests = process.env.E2E_SKIP_DB === '1'

export function uniqueEmail(prefix = 'e2e'): string {
  return `${prefix}-${Date.now()}@sustally-e2e.test`
}
