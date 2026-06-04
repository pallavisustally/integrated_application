'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { scope2SearchParams, validateAssessment } from '../../../lib/assessment-session'

function AssessmentStartContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState('Loading your assessment�')

  useEffect(() => {
    const assessmentId = searchParams.get('assessmentId')?.trim()
    const email = searchParams.get('email')?.trim()

    if (!assessmentId || !email) {
      setError('Invalid assessment link. Missing assessmentId or email.')
      return
    }

    const run = async () => {
      const result = await validateAssessment(assessmentId, email)
      if (!result.success) {
        setError(result.error)
        return
      }

      const a = result.assessment

      if (a.status === 'APPROVED') {
        router.replace(
          `/dashboard?email=${encodeURIComponent(a.email)}&assessmentId=${encodeURIComponent(a.assessmentId)}`,
        )
        return
      }

      if (a.status === 'SUBMITTED') {
        setMessage('Your assessment has been submitted and is under review.')
        return
      }

      const params = scope2SearchParams(a)

      if (a.assessmentType === 'SCOPE_1') {
        setMessage('Opening Scope 1 calculator�')
        router.replace(`/scope1?${params.toString()}`)
        return
      }

      setMessage('Opening Scope 2 assessment�')
      router.replace(`/scope?${params.toString()}`)
    }

    run()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        {error ? (
          <>
            <h1 className="text-lg font-semibold text-red-700 mb-2">Unable to start</h1>
            <p className="text-gray-600 text-sm">{error}</p>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold text-gray-900 mb-2">Sustally Assessment</h1>
            <p className="text-gray-600 text-sm">{message}</p>
            <div className="mt-6 h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </>
        )}
      </div>
    </div>
  )
}

export default function AssessmentStartPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-500">Loading�</div>
      }
    >
      <AssessmentStartContent />
    </Suspense>
  )
}
