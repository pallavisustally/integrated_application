import { NextRequest } from 'next/server'

import { CONSTANT_FACTORS, FUEL_DEFAULTS, GAS_DEFAULTS } from '@/lib/engine/constants'
import { OILGAS_CONSTANT_FACTORS, PROCESS_FACTORS } from '@/lib/engine/oilgas/constants'
import { PULPPAPER_CONSTANT_FACTORS } from '@/lib/engine/pulppaper/constants'
import { scope1JsonResponse, scope1Options } from '@/lib/scope1-api'

export const runtime = 'nodejs'

export const OPTIONS = scope1Options

/** Exposes the seed factor library so the UI can show defaults and let the user override them. */
export function GET(req: NextRequest) {
  const sector = req.nextUrl.searchParams.get('sector') ?? 'cement'

  if (sector === 'oil_gas') {
    return scope1JsonResponse(
      {
        constants: Object.values({ ...OILGAS_CONSTANT_FACTORS, ...PROCESS_FACTORS }),
        fuels: [],
        gases: [],
      },
      req,
    )
  }

  if (sector === 'pulp_paper') {
    return scope1JsonResponse(
      {
        constants: Object.values(PULPPAPER_CONSTANT_FACTORS),
        fuels: [],
        gases: [],
      },
      req,
    )
  }

  return scope1JsonResponse(
    {
      constants: Object.values(CONSTANT_FACTORS),
      fuels: Object.values(FUEL_DEFAULTS),
      gases: Object.values(GAS_DEFAULTS),
    },
    req,
  )
}
