'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

import { scope1ExportPath, type Scope1ExportFormat } from '@/lib/scope1-export'
import {
  breakdownChartSlices,
  buildScope1DriverGroups,
  calculationSummaryRows,
  driverChartSlices,
  gasBreakdownRows,
  gasChartSlices,
  grossScope1FromResult,
  intensityMetricRows,
  type Scope1ChartSlice,
} from '@/lib/scope1-dashboard-drivers'
import { scope1Fetch } from '@/lib/scope1-api'

type Scope1SessionUser = {
  facilityName?: string
  userCompany?: string
  company?: string
  name?: string
  email?: string
  assessmentId?: string
  sector?: string
  sectorCode?: string
  reportingYear?: number
  grossScope1Tonnes?: number
  gwpSet?: string
  reportUrl?: string
  inputPayload?: Record<string, unknown>
  result?: Record<string, unknown>
  id?: string
}

function EmissionsDonutChart({
  title,
  data,
  centerValue,
  centerUnit,
  emptyMessage,
}: {
  title: string
  data: Scope1ChartSlice[]
  centerValue: string
  centerUnit: string
  emptyMessage: string
}) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0)

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 col-span-1 lg:col-span-2 flex flex-col min-h-0 h-full overflow-hidden">
      <h3 className="text-gray-800 text-sm font-semibold mb-2">{title}</h3>
      {data.length > 0 ? (
        <>
          <div className="flex-1 w-full relative min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="75%"
                  paddingAngle={data.length > 1 ? 5 : 0}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) =>
                    `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} tCO₂e`
                  }
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <span className="text-lg font-bold text-gray-900 block">{centerValue}</span>
                <span className="text-[10px] text-gray-500">
                  {centerUnit} <span>Total</span>
                </span>
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs space-y-1 max-h-[120px] overflow-y-auto">
            {data.map((item, i) => {
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0'
              return (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-600 truncate">{item.name}</span>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="font-semibold text-gray-900 block">
                      {item.value.toLocaleString(undefined, { maximumFractionDigits: 2 })} tCO₂e
                    </span>
                    <span className="text-[10px] text-gray-500">{percentage}% of total</span>
                  </div>
                </div>
              )
            })}
            <div className="pt-1 mt-1 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Total Emissions</span>
                <span className="font-semibold text-gray-900">
                  {total.toLocaleString(undefined, { maximumFractionDigits: 2 })} tCO₂e
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400 italic">{emptyMessage}</p>
        </div>
      )}
    </div>
  )
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
  const driverChartData = useMemo(() => driverChartSlices(driverGroups), [driverGroups])
  const breakdownChartData = useMemo(() => {
    const breakdown = breakdownChartSlices(result)
    if (breakdown.length > 0) return breakdown
    return gasChartSlices(result)
  }, [result])
  const intensities = useMemo(() => intensityMetricRows(result), [result])
  const summary = useMemo(() => calculationSummaryRows(result), [result])
  const gasRows = useMemo(() => gasBreakdownRows(result), [result])

  const breakdownTitle =
    breakdownChartSlices(result).length > 0 ? 'Emission Breakdown' : 'Emissions by Gas'

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
  const companyLabel = user.userCompany || user.company || user.name || '—'
  const fyLabel = user.reportingYear ? `FY ${user.reportingYear}` : '—'
  const grossDisplay = gross.toLocaleString(undefined, { maximumFractionDigits: 2 })

  const summaryCards = [
    {
      label: 'Gross Scope 1 Emissions',
      value: grossDisplay,
      unit: 'tCO₂e',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
    ...intensities.slice(0, 2).map((row, i) => ({
      label: row.label,
      value: row.value,
      unit: row.unit,
      iconBg: i === 0 ? 'bg-blue-100' : 'bg-yellow-100',
      iconColor: i === 0 ? 'text-blue-600' : 'text-yellow-600',
      icon:
        i === 0 ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        ),
    })),
  ]

  while (summaryCards.length < 4) {
    const fillers = [
      {
        label: 'GWP Set',
        value: user.gwpSet ?? 'AR6',
        unit: '',
        iconBg: 'bg-gray-100',
        iconColor: 'text-gray-600',
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        ),
      },
      {
        label: 'Data Quality',
        value: summary.find((r) => r.label === 'Data quality')?.value ?? '—',
        unit: '',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        ),
      },
      {
        label: 'Methodology',
        value: summary.find((r) => r.label === 'Methodology')?.value ?? '—',
        unit: '',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        ),
      },
    ]
    summaryCards.push(fillers[summaryCards.length - 1] as (typeof summaryCards)[0])
  }

  return (
    <main
      id="scope1-dashboard-container"
      className="h-screen overflow-hidden flex flex-col bg-[#f8f9fa] p-4 md:p-6 font-sans text-gray-800"
    >
      <div className="flex flex-col gap-4 max-w-[1600px] mx-auto w-full h-full min-h-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 shrink-0">
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
              <span className="uppercase">{sectorLabel}</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-200 shrink-0">
            Approved inventory
          </span>
        </div>

        {/* Level 1: Summary metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 shrink-0">
          {summaryCards.slice(0, 4).map((card) => (
            <div
              key={card.label}
              className="bg-white p-4 rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-medium text-gray-500">{card.label}</p>
                <div
                  className={`w-8 h-8 rounded-full ${card.iconBg} flex items-center justify-center flex-shrink-0`}
                >
                  <svg
                    className={`w-4 h-4 ${card.iconColor}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {card.icon}
                  </svg>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-gray-900 truncate">{card.value}</h3>
                {card.unit ? (
                  <span className="text-xs font-normal text-gray-500">{card.unit}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {/* Level 2: Charts & Available Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1 min-h-0">
          <EmissionsDonutChart
            title="Emissions Drivers"
            data={driverChartData}
            centerValue={grossDisplay}
            centerUnit="tCO₂e"
            emptyMessage="Driver breakdown not available."
          />

          <EmissionsDonutChart
            title={breakdownTitle}
            data={breakdownChartData}
            centerValue={grossDisplay}
            centerUnit="tCO₂e"
            emptyMessage="No category breakdown recorded."
          />

          {/* Available Reports sidebar */}
          <div className="bg-gradient-to-br from-indigo-50 to-white p-4 rounded-xl shadow-sm border border-indigo-100 col-span-1 lg:col-span-1 flex flex-col min-h-0 h-full overflow-hidden">
            <h3 className="text-gray-800 text-sm font-semibold mb-3">Available Reports</h3>
            {error ? <p className="text-red-600 text-xs mb-2">{error}</p> : null}
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex-1 flex items-center justify-between p-4 bg-white rounded-xl border border-indigo-50 hover:border-indigo-200 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="leading-tight min-w-0">
                    <p className="text-sm font-semibold text-gray-800">PDF Report</p>
                    <p className="text-xs text-gray-500">Consultant report</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => download('pdf')}
                  className="text-xs font-bold text-indigo-600 cursor-pointer hover:text-indigo-800 transition-colors disabled:opacity-60 shrink-0 ml-2"
                >
                  {busy === 'pdf' ? 'Loading…' : 'Download'}
                </button>
              </div>

              <div className="flex-1 flex items-center justify-between p-4 bg-white rounded-xl border border-indigo-50 hover:border-indigo-200 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="leading-tight min-w-0">
                    <p className="text-sm font-semibold text-gray-800">Excel + Trace</p>
                    <p className="text-xs text-gray-500">Calculation workbook</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => download('xlsx')}
                  className="text-xs font-bold text-green-600 cursor-pointer hover:text-green-800 transition-colors disabled:opacity-60 shrink-0 ml-2"
                >
                  {busy === 'xlsx' ? 'Loading…' : 'Download'}
                </button>
              </div>

              <div className="flex-1 flex items-center justify-between p-4 bg-white rounded-xl border border-indigo-50 hover:border-indigo-200 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  </div>
                  <div className="leading-tight min-w-0">
                    <p className="text-sm font-semibold text-gray-800">JSON Export</p>
                    <p className="text-xs text-gray-500">Input + result + trace</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => download('json')}
                  className="text-xs font-bold text-blue-600 cursor-pointer hover:text-blue-800 transition-colors disabled:opacity-60 shrink-0 ml-2"
                >
                  {busy === 'json' ? 'Loading…' : 'Download'}
                </button>
              </div>

              {user.reportUrl ? (
                <a
                  href={user.reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center p-2 bg-white rounded-xl border border-green-100 text-xs font-bold text-green-700 hover:border-green-300 transition-colors"
                >
                  Open stored PDF
                </a>
              ) : null}
            </div>
          </div>
        </div>

        {/* Level 3: Calculation summary & finish — same row height */}
        <div className="flex flex-col lg:flex-row gap-4 shrink-0 items-stretch min-h-0">
          <div className="w-full lg:w-[70%] flex flex-col min-h-0">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col min-h-0 flex-1 overflow-hidden max-h-[180px]">
              <h2 className="text-sm font-semibold text-gray-800 shrink-0">Calculation summary</h2>
              <div className="flex-1 overflow-y-auto min-h-0 mt-4 pr-1">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
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
                  {gasRows.map((row) => (
                    <div key={row.label}>
                      <p className="text-[10px] text-gray-500 font-bold tracking-wider">{row.label}</p>
                      <p className="text-sm font-semibold text-gray-900">{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-3 leading-relaxed shrink-0">
              <span className="font-semibold">Disclaimer: </span>
              Scope 1 emissions are calculated using sector-specific methodologies and emission
              factors. Results should be reviewed in the context of your operational boundary and
              data quality before external reporting.
            </p>
          </div>

          <div className="w-full lg:w-[30%] bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-center gap-3 shrink-0">
            <div className="text-center mb-1">
              <h4 className="font-semibold text-gray-800 text-sm">Assessment Complete</h4>
              <p className="text-[10px] text-gray-500">Thank You For Your Submission</p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/scope1/feedback')}
              className="w-full py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-opacity text-xs border border-gray-800 flex items-center justify-center gap-2"
            >
              Finish &amp; Exit
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center shrink-0">
          Assessment ID: {user.assessmentId ?? '—'}
          {user.email ? ` · ${user.email}` : ''}
        </p>
      </div>
    </main>
  )
}

export default function Scope1DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-500">
          Loading dashboard…
        </div>
      }
    >
      <Scope1DashboardContent />
    </Suspense>
  )
}
