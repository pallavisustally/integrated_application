export function corsHeaders(request: Request): Headers {
  const origin = request.headers.get('origin')
  const corsOriginsEnv =
    process.env.CORS_ORIGINS ||
    'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://127.0.0.1:3000,http://127.0.0.1:3001,https://sustally.vercel.app'
  const allowedOrigins = corsOriginsEnv.split(',').map((o) => o.trim())

  const headers = new Headers()
  if (origin && allowedOrigins.includes(origin)) {
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
