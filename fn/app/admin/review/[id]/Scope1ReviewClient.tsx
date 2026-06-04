'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { SUSTALLY_API_URL as API_URL } from '@/lib/api-url'

type Scope1Submission = {
  id: string
  applicationId?: string
  assessmentId?: string
  name?: string
  facilityName?: string
  inventoryName?: string
  sectorCode?: string
  reportingYear?: number
  status?: string
  reviewStatus?: string
  grossScope1Tonnes?: number
  rejectionReason?: string
  result?: { scope1?: { grossScope1CO2eTonnes?: number } }
}

export default function Scope1ReviewClient({ submission }: { submission: Scope1Submission }) {
  const router = useRouter()
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [busy, setBusy] = useState(false)

  const applicationId = submission.applicationId || submission.id
  const displayStatus = submission.status || submission.reviewStatus

  const legacyOnly = !submission.applicationId && !!submission.reviewStatus

  const patchApplication = async (data: Record<string, unknown>) => {
    if (legacyOnly) {
      const reviewStatus =
        data.status === 'APPROVED'
          ? 'approved'
          : data.status === 'REJECTED'
            ? 'rejected'
            : 'pending'
      const res = await fetch(`${API_URL}/api/scope1-assessments/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewStatus,
          rejectionReason: data.rejectionReason,
        }),
      })
      if (!res.ok) throw new Error('Update failed')
      return
    }

    const res = await fetch(`${API_URL}/api/scope1-applications/${applicationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Update failed')
  }

  const approve = async () => {
    if (!confirm('Approve this Scope 1 inventory? PDF will be generated and applicant emailed.')) return
    setBusy(true)
    try {
      await patchApplication({ status: 'APPROVED' })
      alert('Approved. Reports and email are being generated.')
      router.refresh()
    } catch {
      alert('Approval failed')
    } finally {
      setBusy(false)
    }
  }

  const reject = async () => {
    if (!rejectReason.trim()) return
    setBusy(true)
    try {
      await patchApplication({
        status: 'REJECTED',
        rejectionReason: rejectReason.trim(),
      })
      alert('Rejected. Applicant will receive a retry link.')
      router.refresh()
    } catch {
      alert('Rejection failed')
    } finally {
      setBusy(false)
    }
  }

  const tonnes =
    submission.grossScope1Tonnes ??
    submission.result?.scope1?.grossScope1CO2eTonnes ??
    0

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">
          Scope 1 review
        </p>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {submission.facilityName || submission.inventoryName || submission.name || 'Inventory'}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {submission.sectorCode} � FY {submission.reportingYear} � Assessment{' '}
          {submission.assessmentId} � Status {displayStatus}
        </p>

        <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-6 mb-8">
          <p className="text-xs text-indigo-800 font-semibold uppercase">Gross Scope 1 (t CO?e)</p>
          <p className="text-3xl font-bold text-indigo-950">{Number(tonnes).toLocaleString()}</p>
        </div>

        {(displayStatus === 'pending' || displayStatus === 'PENDING') && (
          <div className="flex gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={approve}
              className="px-5 py-2.5 bg-green-700 text-white rounded-lg font-semibold text-sm disabled:opacity-60"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setShowReject(true)}
              className="px-5 py-2.5 bg-white border border-red-200 text-red-700 rounded-lg font-semibold text-sm"
            >
              Reject
            </button>
          </div>
        )}

        {showReject && (
          <div className="mt-6 space-y-3">
            <textarea
              className="w-full border border-gray-200 rounded-lg p-3 text-sm"
              rows={4}
              placeholder="Rejection reason for the applicant"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <button
              type="button"
              disabled={busy || !rejectReason.trim()}
              onClick={reject}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-60"
            >
              Confirm reject
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
