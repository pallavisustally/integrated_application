import { calculateOilGas } from '@/lib/engine/oilgas'
import type { OilGasInputPayload } from '@/lib/engine/oilgas'
import { scope1JsonResponse, scope1Options, parseJsonBody } from '@/lib/scope1-api'
import { saveScope1IfRequested } from '@/lib/scope1-persist'

export const runtime = 'nodejs'

export const OPTIONS = scope1Options

export async function POST(req: Request) {
  const payload = await parseJsonBody<OilGasInputPayload>(req)
  if (!payload) {
    return scope1JsonResponse({ error: 'Invalid JSON body' }, req, 400)
  }

  let result
  try {
    result = calculateOilGas(payload)
  } catch (err) {
    return scope1JsonResponse(
      {
        error: 'Calculation engine error',
        detail: err instanceof Error ? err.message : String(err),
      },
      req,
      500,
    )
  }

  const saved = await saveScope1IfRequested(req, 'OIL_GAS', payload, result)
  if (saved && 'calculationId' in saved) {
    return scope1JsonResponse({ result, calculationId: saved.calculationId }, req)
  }
  if (saved && 'persistenceWarning' in saved) {
    return scope1JsonResponse({ result, calculationId: null, ...saved }, req)
  }

  return scope1JsonResponse({ result, calculationId: null }, req)
}
