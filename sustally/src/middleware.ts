import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isAllowedCorsOrigin } from './lib/app-urls'

function applyCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
  if (origin && isAllowedCorsOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')
  return response
}

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin')

    if (request.method === 'OPTIONS') {
      return applyCorsHeaders(new NextResponse(null, { status: 200 }), origin)
    }

    return applyCorsHeaders(NextResponse.next(), origin)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
