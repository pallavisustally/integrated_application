import { scope1JsonResponse, scope1Options, parseJsonBody } from '@/lib/scope1-api'

export const runtime = 'nodejs'

export const OPTIONS = scope1Options

/**
 * Lock a saved Scope 1 calculation (review workflow).
 * Sets reviewStatus to pending — full maker-checker fields are a follow-up.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  if (!id) {
    return scope1JsonResponse({ error: 'Missing calculation id' }, req, 400)
  }

  const body = (await parseJsonBody<{ actor?: string }>(req)) ?? {}

  try {
    const { getPayload } = await import('payload')
    const config = (await import('@/payload.config')).default
    const cms = await getPayload({ config })

    const existing = await cms.findByID({
      collection: 'scope1-assessments',
      id,
      depth: 0,
    })

    const updated = await cms.update({
      collection: 'scope1-assessments',
      id,
      data: {
        reviewStatus: 'pending',
        submittedAt: new Date().toISOString(),
      },
    })

    const publicAssessmentId =
      typeof existing.assessmentId === 'string' ? existing.assessmentId : undefined
    const parentId =
      typeof existing.assessment === 'string' || typeof existing.assessment === 'number'
        ? String(existing.assessment)
        : undefined

    if (parentId) {
      await cms.update({
        collection: 'assessments',
        id: parentId,
        data: { status: 'SUBMITTED', submittedAt: new Date().toISOString() },
      })
    } else if (publicAssessmentId) {
      const parents = await cms.find({
        collection: 'assessments',
        where: { assessmentId: { equals: publicAssessmentId } },
        limit: 1,
      })
      if (parents.totalDocs > 0) {
        await cms.update({
          collection: 'assessments',
          id: parents.docs[0].id,
          data: { status: 'SUBMITTED', submittedAt: new Date().toISOString() },
        })
      }
    }

    try {
      const { upsertScope1ApplicationForSubmission } = await import(
        '@/lib/scope1-application-sync'
      )
      await upsertScope1ApplicationForSubmission(cms, id)
    } catch (syncErr) {
      console.error('[Scope1 lock] Failed to sync scope1-applications:', syncErr)
    }

    return scope1JsonResponse(
      {
        id: updated.id ?? id,
        reviewStatus: 'pending',
        submittedAt: updated.submittedAt,
        lockedBy: body.actor || 'system',
      },
      req,
    )
  } catch (err) {
    return scope1JsonResponse(
      { error: 'Lock failed', detail: err instanceof Error ? err.message : String(err) },
      req,
      500,
    )
  }
}
