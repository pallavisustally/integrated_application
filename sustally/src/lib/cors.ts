import { isAllowedCorsOrigin } from './app-urls'

export function corsHeaders(request: Request): Headers {
  const origin = request.headers.get('origin')

  const headers = new Headers()
  if (origin && isAllowedCorsOrigin(origin)) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Access-Control-Allow-Credentials', 'true')
  }
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  headers.set('Access-Control-Max-Age', '86400')
  return headers
}

export function jsonResponse(
  request: Request,
  body: unknown,
  status = 200,
): Response {
  const headers = corsHeaders(request)
  headers.set('Content-Type', 'application/json')
  return Response.json(body, { status, headers })
}

export function corsPreflightResponse(request: Request): Response {
  return new Response(null, { status: 200, headers: corsHeaders(request) })
}
