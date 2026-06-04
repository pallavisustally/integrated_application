'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_SUSTALLY_API_URL || 'http://localhost:3001'

type Props = {
  data: Record<string, unknown>
  applicationId: string
  onStatusChange?: (status: string) => void
}

export default function Scope1AssessmentReview({ data, applicationId, onStatusChange }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(String(data.status || 'PENDING'))
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [busy, setBusy] = useState(false)

  const tonnes = data.grossScope1Tonnes ?? 0
  const legacyOnly = Boolean(data._legacyAssessmentOnly)

  const patch = async (body: Record<string, unknown>) => {
    if (legacyOnly) {
      const reviewStatus =
        body.status === 'APPROVED'
          ? 'approved'
          : body.status === 'REJECTED'
            ? 'rejected'
            : 'pending'
      const res = await fetch(`${API_URL}/api/scope1-assessments/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewStatus,
          rejectionReason: body.rejectionReason,
        }),
      })
      if (!res.ok) throw new Error('Update failed')
      return
    }

    const res = await fetch(`${API_URL}/api/scope1-applications/${applicationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error('Update failed')
  }

  const approve = async () => {
    if (!confirm('Approve this Scope 1 inventory? Reports and email will be sent to the applicant.')) {
      return
    }
    setBusy(true)
    try {
      await patch({ status: 'APPROVED' })
      setStatus('APPROVED')
      onStatusChange?.('APPROVED')
      alert('Approved successfully.')
      router.refresh()
    } catch {
      alert('Approval failed. Check that Sustally is running and the record exists.')
    } finally {
      setBusy(false)
    }
  }

  const reject = async () => {
    if (!rejectReason.trim()) return
    setBusy(true)
    try {
      await patch({ status: 'REJECTED', rejectionReason: rejectReason.trim() })
      setStatus('REJECTED')
      onStatusChange?.('REJECTED')
      setShowReject(false)
      alert('Rejected. Applicant will be notified.')
      router.refresh()
    } catch {
      alert('Rejection failed.')
    } finally {
      setBusy(false)
    }
  }

  const pending = status === 'PENDING' || status === 'IN_PROGRESS'

  return (
    <main className="min-h-screen bg-[#f8f9fa] p-4 font-sans text-gray-900 flex flex-col items-center pb-24">
      <div className="w-full max-w-3xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="text-gray-500 hover:text-gray-700">
            ← Back
          </Link>
          <div>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
              Scope 1 assessment review
            </p>
            <h1 className="text-2xl font-bold text-gray-900">
              {String(data.facilityName || data.inventoryName || 'Inventory')}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {String(data.sectorCode || '')}
              {data.reportingYear ? ` · FY ${data.reportingYear}` : ''}
              {data.assessmentId ? ` · Ref ${data.assessmentId}` : ''}
              {legacyOnly ? ' · Legacy assessment record (no application row yet)' : ''}
            </p>
          </div>
          <span
            className={`ml-auto px-4 py-1.5 rounded-full text-sm font-bold border ${
              status === 'APPROVED'
                ? 'bg-green-100 text-green-700 border-green-200'
                : status === 'REJECTED'
                  ? 'bg-red-100 text-red-700 border-red-200'
                  : 'bg-orange-100 text-orange-700 border-orange-200'
            }`}
          >
            {status.replace('_', ' ')}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase">Applicant</p>
          <p className="text-sm font-medium text-gray-900 mt-1">{String(data.userName || data.email || '—')}</p>
          <p className="text-sm text-gray-600">{String(data.userCompany || '—')}</p>
          <p className="text-sm text-gray-600">{String(data.email || '—')}</p>
          {data.userMobile ? (
            <p className="text-sm text-gray-600">{String(data.userMobile)}</p>
          ) : null}
        </div>

        <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-6 mb-8">
          <p className="text-xs text-indigo-800 font-semibold uppercase">Gross Scope 1 (t CO₂e)</p>
          <p className="text-3xl font-bold text-indigo-950">
            {Number(tonnes).toLocaleString()}
          </p>
        </div>

        {pending && (
          <div className="flex gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => setShowReject(true)}
              className="px-6 py-2.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-bold text-sm"
            >
              Reject
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={approve}
              className="px-6 py-2.5 rounded-full bg-green-600 text-white font-bold text-sm shadow-lg"
            >
              {busy ? 'Processing…' : 'Approve'}
            </button>
          </div>
        )}

        {!pending && (
          <p className="text-gray-500 text-sm font-medium">This submission has already been processed.</p>
        )}

        {showReject && (
          <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <textarea
              className="w-full border border-gray-200 rounded-lg p-3 text-sm"
              rows={4}
              placeholder="Rejection reason for the applicant"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="text-sm text-gray-600 px-4 py-2"
                onClick={() => setShowReject(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || !rejectReason.trim()}
                onClick={reject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-60"
              >
                Confirm reject
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
