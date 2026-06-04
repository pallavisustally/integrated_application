'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { scope1Fetch } from '@/lib/scope1-api'

type Scope1SessionUser = {
  facilityName?: string
  company?: string
  name?: string
  email?: string
  assessmentId?: string
  sectorCode?: string
  reportingYear?: number
  grossScope1Tonnes?: number
  gwpSet?: string
  inputPayload?: Record<string, unknown>
}

function Scope1ReportContent() {
  const router = useRouter()
  const [user, setUser] = useState<Scope1SessionUser | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('scope1_user')
      if (!raw) {
        router.replace('/dashboard')
        return
      }
      setUser(JSON.parse(raw) as Scope1SessionUser)
    } catch {
      router.replace('/dashboard')
    }
  }, [router])

  const download = useCallback(
    async (format: 'pdf' | 'xlsx' | 'json') => {
      if (!user?.inputPayload) {
        setError('Report data is missing. Contact support.')
        return
      }
      setError('')
      setBusy(format)
      try {
        const res = await scope1Fetch('/api/v1/calculations/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload: user.inputPayload, format }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error((err as { error?: string }).error || 'Export failed')
        }
        const blob = await res.blob()
        const disposition = res.headers.get('Content-Disposition') || ''
        const match = disposition.match(/filename="([^"]+)"/)
        const filename = match?.[1] || `scope1-report.${format}`
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Download failed')
      } finally {
        setBusy(null)
      }
    },
    [user],
  )

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  const tonnes = user.grossScope1Tonnes ?? 0

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <span className="font-bold text-indigo-600 text-xl">Scope 1 report</span>
        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem('scope1_user')
            router.push('/dashboard')
          }}
          className="text-sm text-gray-600 hover:text-red-600"
        >
          Logout
        </button>
      </nav>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {user.facilityName || user.company || 'Your facility'}
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            FY {user.reportingYear ?? '�'} � {user.sectorCode?.replace('_', ' & ') ?? 'Scope 1'} � GWP{' '}
            {user.gwpSet ?? 'AR6'}
          </p>

          <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-6 mb-6">
            <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wide">
              Gross Scope 1 (t CO?e)
            </p>
            <p className="text-3xl font-bold text-indigo-950 mt-1">
              {tonnes.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!!busy}
              onClick={() => download('pdf')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold disabled:opacity-60"
            >
              {busy === 'pdf' ? 'Preparing�' : 'Download PDF'}
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => download('xlsx')}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-800 rounded-lg text-sm font-semibold disabled:opacity-60"
            >
              {busy === 'xlsx' ? 'Preparing�' : 'Download Excel'}
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => download('json')}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-800 rounded-lg text-sm font-semibold disabled:opacity-60"
            >
              {busy === 'json' ? 'Preparing�' : 'Download JSON'}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center">
          Assessment ID: {user.assessmentId ?? '�'}
        </p>
      </main>
    </div>
  )
}

export default function Scope1ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-500">
          Loading report�
        </div>
      }
    >
      <Scope1ReportContent />
    </Suspense>
  )
}
