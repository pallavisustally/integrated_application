import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin')
    // Get allowed origins from environment variable or use defaults
    const corsOriginsEnv = process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://127.0.0.1:3000,http://127.0.0.1:3001,https://sustally.vercel.app'
    const allowedOrigins = corsOriginsEnv.split(',').map(origin => origin.trim())

    // Create response
    const response = NextResponse.next()

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      const preflightResponse = new NextResponse(null, { status: 200 })

      if (origin && allowedOrigins.includes(origin)) {
        preflightResponse.headers.set('Access-Control-Allow-Origin', origin)
      }
      preflightResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
      preflightResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      preflightResponse.headers.set('Access-Control-Allow-Credentials', 'true')
      preflightResponse.headers.set('Access-Control-Max-Age', '86400')

      return preflightResponse
    }

    // Add CORS headers to actual requests
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
