'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { EmissionsDriverChart } from '@/components/wizard-shared'
import { scope1ExportPath, type Scope1ExportFormat } from '@/lib/scope1-export'
import {
  breakdownRows,
  buildScope1DriverGroups,
  calculationSummaryRows,
  gasBreakdownRows,
  grossScope1FromResult,
  intensityMetricRows,
} from '@/lib/scope1-dashboard-drivers'
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
  reportUrl?: string
  inputPayload?: Record<string, unknown>
  result?: Record<string, unknown>
}

function Scope1DashboardContent() {
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

  const result = (user?.result || {}) as Record<string, unknown>
  const gross = user?.grossScope1Tonnes ?? grossScope1FromResult(result)
  const driverGroups = useMemo(() => buildScope1DriverGroups(result), [result])
  const breakdown = useMemo(() => breakdownRows(result), [result])
  const intensities = useMemo(() => intensityMetricRows(result), [result])
  const summary = useMemo(() => calculationSummaryRows(result), [result])
  const gasRows = useMemo(() => gasBreakdownRows(result), [result])

  const download = useCallback(
    async (format: Scope1ExportFormat) => {
      if (!user?.inputPayload) {
        setError('Report data is missing. Contact support.')
        return
      }
      setError('')
      setBusy(format)
      try {
        const path = scope1ExportPath(user.sectorCode)
        const res = await scope1Fetch(path, {
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
        const filename = match?.[1] || `scope1-report.${format === 'json' ? 'json' : format}`
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
        <div className="animate-spin h-8 w-8 border-2 border-[#7b3ff2] border-t-transparent rounded-full" />
      </div>
    )
  }

  const facilityLabel = user.facilityName || user.company || 'Your facility'
  const sectorLabel = user.sectorCode?.replace(/_/g, ' & ') ?? 'Scope 1'
  const companyLabel = user.company || user.name || '—'
  const fyLabel = user.reportingYear ? `FY ${user.reportingYear}` : '—'

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/sustally-logo.png" alt="Sustally" className="h-8 w-auto" />
          <span className="font-bold text-[#7b3ff2] text-lg">Scope 1 dashboard</span>
        </div>
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

      <main id="scope1-dashboard-container" className="max-w-[1600px] mx-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              Scope 1 Emissions Performance
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-gray-500 text-sm">
              <span className="font-medium text-gray-700">{companyLabel}</span>
              <span className="w-1 h-1 bg-gray-400 rounded-full" />
              <span>{facilityLabel}</span>
              <span className="w-1 h-1 bg-gray-400 rounded-full" />
              <span>{fyLabel}</span>
              <span className="w-1 h-1 bg-gray-400 rounded-full" />
              <span>{sectorLabel}</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-200">
            Approved inventory
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <p className="text-xs font-medium text-gray-500">Gross Scope 1</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h3 className="text-2xl font-bold text-gray-900">
                {gross.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </h3>
              <span className="text-xs text-gray-500">tCO2e</span>
            </div>
          </div>
          {intensities.slice(0, 3).map((row) => (
            <div
              key={row.label}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between"
            >
              <p className="text-xs font-medium text-gray-500">{row.label}</p>
              <div className="flex items-baseline gap-2 mt-2">
                <h3 className="text-2xl font-bold text-gray-900">{row.value}</h3>
                <span className="text-xs text-gray-500">{row.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Emissions drivers</h2>
            {driverGroups.length > 0 ? (
              <EmissionsDriverChart gross={gross} groups={driverGroups} />
            ) : (
              <p className="text-sm text-gray-400 italic">Driver breakdown not available.</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Emission breakdown</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 max-h-[320px] overflow-y-auto">
              {breakdown.length > 0 ? (
                breakdown.map((row) => (
                  <div key={row.label}>
                    <p className="text-[10px] text-gray-500 font-bold tracking-wider">{row.label}</p>
                    <p className="text-sm font-semibold text-gray-900">{row.value}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic col-span-2">No category breakdown recorded.</p>
              )}
            </div>
          </div>
        </div>

        {(summary.length > 0 || gasRows.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {summary.length > 0 && (
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-800 mb-4">Calculation summary</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  {summary.map((row) => (
                    <div key={row.label}>
                      <p className="text-[10px] text-gray-500 font-bold tracking-wider">{row.label}</p>
                      <p className="text-sm font-semibold text-gray-900">{row.value}</p>
                    </div>
                  ))}
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold tracking-wider">GWP set</p>
                    <p className="text-sm font-semibold text-gray-900">{user.gwpSet ?? 'AR6'}</p>
                  </div>
                </div>
              </div>
            )}
            {gasRows.length > 0 && (
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-800 mb-4">Emissions by gas</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  {gasRows.map((row) => (
                    <div key={row.label}>
                      <p className="text-[10px] text-gray-500 font-bold tracking-wider">{row.label}</p>
                      <p className="text-sm font-semibold text-gray-900">{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-800 mb-1">Download official report</h2>
          <p className="text-xs text-gray-500 mb-4">
            PDF consultant report, Excel workbook with calculation trace, or full JSON (input + result + trace).
          </p>
          {error ? <p className="text-red-600 text-sm mb-3">{error}</p> : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!!busy}
              onClick={() => download('pdf')}
              className="px-5 py-2.5 bg-[#7b3ff2] text-white rounded-lg text-sm font-semibold hover:bg-[#6a32d9] disabled:opacity-60"
            >
              {busy === 'pdf' ? 'Preparing…' : 'PDF report'}
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => download('xlsx')}
              className="px-5 py-2.5 bg-white border border-gray-300 text-gray-800 rounded-lg text-sm font-semibold disabled:opacity-60"
            >
              {busy === 'xlsx' ? 'Preparing…' : 'Excel + trace'}
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => download('json')}
              className="px-5 py-2.5 bg-white border border-gray-300 text-gray-800 rounded-lg text-sm font-semibold disabled:opacity-60"
            >
              {busy === 'json' ? 'Preparing…' : 'JSON (input + result)'}
            </button>
            {user.reportUrl ? (
              <a
                href={user.reportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm font-semibold"
              >
                Open stored PDF
              </a>
            ) : null}
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center pb-8">
          Assessment ID: {user.assessmentId ?? '—'}
          {user.email ? ` · ${user.email}` : ''}
        </p>
      </main>
    </div>
  )
}

export default function Scope1DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-500">Loading dashboard…</div>
      }
    >
      <Scope1DashboardContent />
    </Suspense>
  )
}
