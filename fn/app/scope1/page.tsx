'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { CalculatorRoot } from '@/components/calculator-root'
import { scope2SearchParams, validateAssessment } from '@/lib/assessment-session'

function Scope1PageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [gate, setGate] = useState<'loading' | 'ready' | 'blocked'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const id = searchParams.get('assessmentId')?.trim()
    const email = searchParams.get('email')?.trim()

    if (!id || !email) {
      setGate('ready')
      return
    }

    const run = async () => {
      const result = await validateAssessment(id, email)
      if (!result.success) {
        setGate('blocked')
        setMessage(result.error)
        return
      }

      const a = result.assessment
      if (a.assessmentType === 'SCOPE_2') {
        router.replace(`/scope?${scope2SearchParams(a).toString()}`)
        return
      }

      if (a.status === 'APPROVED') {
        router.replace(
          `/dashboard?email=${encodeURIComponent(a.email)}&assessmentId=${encodeURIComponent(a.assessmentId)}`,
        )
        return
      }

      if (a.status === 'SUBMITTED' && searchParams.get('retry') !== 'true') {
        setGate('blocked')
        setMessage(
          'This assessment has already been submitted and is under review.',
        )
        return
      }

      setGate('ready')
    }

    run()
  }, [router, searchParams])

  if (gate === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper,#fff)]">
        <div className="animate-spin h-10 w-10 border-2 border-[var(--purple,#7b3ff2)] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (gate === 'blocked') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--paper,#fff)]">
        <div className="max-w-md w-full bg-white rounded-xl border border-[var(--line,#e8e6ee)] p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Scope 1 assessment</h1>
          <p className="text-gray-600 text-sm">{message}</p>
        </div>
      </div>
    )
  }

  return <CalculatorRoot />
}

export default function Scope1Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-500">
          Loading Scope 1 calculator�
        </div>
      }
    >
      <Scope1PageContent />
    </Suspense>
  )
}
