'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Legacy route — post-approval dashboard lives at /scope1/dashboard */
export default function Scope1ReportRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/scope1/dashboard')
  }, [router])
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 text-sm">
      Redirecting to dashboard…
    </div>
  )
}
