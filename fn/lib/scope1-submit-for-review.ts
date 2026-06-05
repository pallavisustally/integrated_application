import { lockScope1Calculation } from '@/lib/scope1-lock'
import { scope1Fetch, scope1SaveQuery } from '@/lib/scope1-api'

export async function submitScope1ForReview(
  calculatePath: string,
  payload: unknown,
  actor: string,
): Promise<{ ok: true; calculationId: string } | { ok: false; message: string }> {
  try {
    const calcRes = await scope1Fetch(`${calculatePath}${scope1SaveQuery(true)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const calcData = await calcRes.json().catch(() => ({}))
    if (!calcRes.ok) {
      return {
        ok: false,
        message:
          (calcData as { error?: string; detail?: string }).error ||
          (calcData as { detail?: string }).detail ||
          'Failed to save calculation before submit',
      }
    }

    const calculationId =
      (calcData as { calculationId?: string }).calculationId ||
      (calcData as { result?: { calculationId?: string } }).result?.calculationId

    if (!calculationId) {
      return { ok: false, message: 'Calculation was not persisted. Check booking link and try again.' }
    }

    const lockOut = await lockScope1Calculation(calculationId, actor || 'system')
    if (!lockOut.ok) {
      return { ok: false, message: lockOut.message }
    }

    return { ok: true, calculationId }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Submit for review failed' }
  }
}
