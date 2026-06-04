import { scope1Fetch } from '@/lib/scope1-api'

export async function lockScope1Calculation(
  calculationId: string,
  actor: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const r = await scope1Fetch(`/api/v1/calculations/${calculationId}/lock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actor: actor || 'system' }),
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    const message =
      (err as { detail?: string; error?: string }).detail ||
      (err as { error?: string }).error ||
      r.statusText
    return { ok: false, message }
  }
  return { ok: true }
}
