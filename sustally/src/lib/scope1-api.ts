import { corsHeaders } from './cors'

export function scope1JsonResponse(body: unknown, request: Request, status = 200): Response {
  const headers = corsHeaders(request)
  headers.set('Content-Type', 'application/json')
  return Response.json(body, { status, headers })
}

export function scope1Options(request: Request): Response {
  return new Response(null, { status: 200, headers: corsHeaders(request) })
}

export async function parseJsonBody<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T
  } catch {
    return null
  }
}
