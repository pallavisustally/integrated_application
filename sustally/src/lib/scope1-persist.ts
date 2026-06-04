import type { Payload } from 'payload'

export type Scope1SectorCode = 'CEMENT' | 'OIL_GAS' | 'PULP_PAPER' | 'POWER' | 'IRON_STEEL'

type PersistInput = {
  sectorCode: Scope1SectorCode
  assessmentId?: string
  organizationName?: string
  facilityName?: string
  reportingYear: number
  gwpSet?: string
  engineStatus: string
  grossScope1Tonnes: number
  biomassMemoTonnes?: number
  supportingScope2Tonnes?: number
  supportingScope3Tonnes?: number
  inputPayload: Record<string, unknown>
  result: Record<string, unknown>
  calculationTrace?: Record<string, unknown>
  factorSnapshots?: Record<string, unknown>
}

function mapEngineStatus(status: string): 'draft' | 'calculated' | 'success_with_warnings' | 'blocked' {
  if (status === 'BLOCKED') return 'blocked'
  if (status === 'SUCCESS_WITH_WARNINGS') return 'success_with_warnings'
  if (status === 'SUCCESS') return 'calculated'
  return 'draft'
}

export async function persistScope1Calculation(
  cms: Payload,
  input: PersistInput,
): Promise<{ id: string }> {
  let assessmentRelationId: string | undefined
  if (input.assessmentId) {
    const lookup = await cms.find({
      collection: 'assessments',
      where: { assessmentId: { equals: input.assessmentId } },
      limit: 1,
    })
    if (lookup.totalDocs > 0) {
      assessmentRelationId = String(lookup.docs[0].id)
    }
  }

  const name = `${input.organizationName ?? 'Org'} � ${input.facilityName ?? 'Facility'} � FY ${input.reportingYear}`

  const saved = await cms.create({
    collection: 'scope1-assessments',
    data: {
      assessmentId: input.assessmentId || `LOCAL-${Date.now()}`,
      assessment: assessmentRelationId,
      name,
      sectorCode: input.sectorCode,
      reportingYear: input.reportingYear,
      reviewStatus: 'draft',
      engineStatus: mapEngineStatus(input.engineStatus),
      gwpSet: input.gwpSet ?? 'AR6',
      grossScope1Tonnes: input.grossScope1Tonnes,
      biomassMemoTonnes: input.biomassMemoTonnes ?? 0,
      supportingScope2Tonnes: input.supportingScope2Tonnes ?? 0,
      supportingScope3Tonnes: input.supportingScope3Tonnes ?? 0,
      inputPayload: input.inputPayload,
      result: input.result,
      calculationTrace: input.calculationTrace,
      factorSnapshots: input.factorSnapshots,
      calculatedAt: new Date().toISOString(),
    } as never,
  })

  return { id: String(saved.id) }
}

type SaveablePayload = {
  assessmentId?: string
  organization?: { name?: string }
  facility?: { name?: string }
  calculationContext?: { reportingPeriod?: { year?: number }; gwpSet?: string }
}

type SaveableResult = {
  status: string
  gwpSet?: string
  scope1: {
    grossScope1CO2Tonnes?: number
    grossScope1CO2eTonnes?: number
  }
  memoItems?: Record<string, number | undefined>
  supportingScope2?: Record<string, number | undefined>
  supportingScope3?: Record<string, number | undefined>
  calculationTrace?: unknown
  factorSnapshots?: unknown
}

export async function saveScope1IfRequested(
  req: Request,
  sectorCode: Scope1SectorCode,
  payload: SaveablePayload,
  result: SaveableResult,
): Promise<{ calculationId: string } | { persistenceWarning: string } | null> {
  const url = new URL(req.url)
  if (url.searchParams.get('save') !== 'true') return null

  const assessmentId =
    payload.assessmentId || url.searchParams.get('assessmentId') || undefined

  try {
    const { getPayload } = await import('payload')
    const config = (await import('@/payload.config')).default
    const cms = await getPayload({ config })

    const gross =
      result.scope1.grossScope1CO2eTonnes ?? result.scope1.grossScope1CO2Tonnes ?? 0

    const saved = await persistScope1Calculation(cms, {
      sectorCode,
      assessmentId,
      organizationName: payload.organization?.name,
      facilityName: payload.facility?.name,
      reportingYear:
        payload.calculationContext?.reportingPeriod?.year ?? new Date().getFullYear(),
      gwpSet: result.gwpSet ?? payload.calculationContext?.gwpSet,
      engineStatus: result.status,
      grossScope1Tonnes: gross,
      biomassMemoTonnes:
        (result.memoItems?.biomassCO2Tonnes as number | undefined) ??
        (result.memoItems?.biogenicCO2Tonnes as number | undefined) ??
        0,
      supportingScope2Tonnes:
        (result.supportingScope2?.purchasedElectricityCO2Tonnes as number | undefined) ??
        (result.supportingScope2?.purchasedElectricityCO2eTonnes as number | undefined) ??
        0,
      supportingScope3Tonnes:
        (result.supportingScope3?.boughtClinkerCO2Tonnes as number | undefined) ??
        (result.supportingScope3?.thirdPartyMobileCO2eTonnes as number | undefined) ??
        0,
      inputPayload: payload as unknown as Record<string, unknown>,
      result: result as unknown as Record<string, unknown>,
      calculationTrace: result.calculationTrace as Record<string, unknown> | undefined,
      factorSnapshots: result.factorSnapshots as Record<string, unknown> | undefined,
    })

    return { calculationId: saved.id }
  } catch (err) {
    return {
      persistenceWarning: err instanceof Error ? err.message : String(err),
    }
  }
}
