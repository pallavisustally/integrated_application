'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import { Scope1ReviewGridReadOnly } from '@/components/review/Scope1ReviewGrid'
import { SUSTALLY_API_URL as API_URL } from '@/lib/api-url'
import { buildScope1ReviewQuadrants } from '@/lib/scope1-review-build'

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

  const legacyOnly = Boolean(data._legacyAssessmentOnly)

  const quadrants = useMemo(() => {
    const payload = (data.inputPayload as Record<string, unknown>) || {}
    const result = (data.result as Record<string, unknown>) || {}
    if (!data.inputPayload && !data.result) return null
    return buildScope1ReviewQuadrants(
      payload,
      result,
      String(data.sectorCode || payload.sectorCode || ''),
    )
  }, [data])

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

  const header = (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 flex-shrink-0">
      <div className="flex items-start gap-4">
        <Link href="/" className="text-gray-500 hover:text-gray-700 mt-1">
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
            {data.assessmentId ? ` · Ref: ${data.assessmentId}` : ''}
            {legacyOnly ? ' · Legacy assessment record (no application row yet)' : ''}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {String(data.userName || '—')} · {String(data.userCompany || '—')} · {String(data.email || '—')}
            {data.userMobile ? ` · ${String(data.userMobile)}` : ''}
          </p>
        </div>
      </div>
      <span
        className={`px-4 py-1.5 rounded-full text-sm font-bold border shrink-0 ${
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
  )

  const footer = (
    <div className="mt-4">
      {pending ? (
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
      ) : (
        <p className="text-gray-500 text-sm font-medium">This submission has already been processed.</p>
      )}

      {showReject && (
        <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4 space-y-3 max-w-xl">
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
  )

  return (
    <main className="min-h-screen bg-[#f8f9fa] p-4 font-sans text-gray-900 flex flex-col items-center pb-24">
      {quadrants ? (
        <Scope1ReviewGridReadOnly quadrants={quadrants} header={header} footer={footer} />
      ) : (
        <div className="w-full max-w-3xl">
          {header}
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-6 text-sm text-amber-900">
            Calculation snapshot not loaded. Ensure Sustally is running and this application is linked to a
            scope1-assessment with inputPayload and result saved.
          </div>
          {footer}
        </div>
      )}
    </main>
  )
}
