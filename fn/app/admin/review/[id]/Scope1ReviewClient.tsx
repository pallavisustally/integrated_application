'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Scope1ReviewGridReadOnly } from '@/components/review/scope1-review-page'
import { buildScope1ReviewQuadrants } from '@/lib/scope1-review-build'
import { useAppDialog } from '@/components/app-dialog-provider'
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
  inputPayload?: unknown
  result?: unknown
}

export default function Scope1ReviewClient({ submission }: { submission: Scope1Submission }) {
  const router = useRouter()
  const dialog = useAppDialog()
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(submission.status || submission.reviewStatus || 'PENDING')

  const applicationId = submission.applicationId || submission.id
  const legacyOnly = !submission.applicationId && !!submission.reviewStatus

  const quadrants = useMemo(() => {
    const payload = (submission.inputPayload || {}) as Record<string, unknown>
    const result = (submission.result || {
      scope1: {
        grossScope1CO2eTonnes: submission.grossScope1Tonnes,
        grossScope1CO2Tonnes: submission.grossScope1Tonnes,
      },
    }) as Record<string, unknown>
    return buildScope1ReviewQuadrants(payload, result, submission.sectorCode)
  }, [submission])

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
    const ok = await dialog.confirm(
      'Approve this Scope 1 inventory? Reports will be generated and the applicant emailed.',
      'Approve inventory',
    )
    if (!ok) return
    setBusy(true)
    try {
      await patchApplication({ status: 'APPROVED' })
      setStatus('APPROVED')
      await dialog.notify('Approved. Reports and email are being generated.', 'success')
      router.refresh()
    } catch {
      await dialog.notify('Approval failed', 'error')
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
      setStatus('REJECTED')
      setShowRejectModal(false)
      await dialog.notify('Rejected. Applicant will receive a retry link.', 'success')
      router.refresh()
    } catch {
      await dialog.notify('Rejection failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  const pending =
    status === 'pending' || status === 'PENDING' || status === 'IN_PROGRESS'

  const header = (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Review Panel</h1>
        <p className="text-gray-500 text-sm mt-1">
          Scope 1 · {submission.facilityName || submission.inventoryName || submission.name || 'Inventory'} ·{' '}
          {submission.assessmentId || applicationId}
        </p>
      </div>
      <div
        className={`px-4 py-1.5 rounded-full text-sm font-bold border ${
          status === 'APPROVED' || status === 'approved'
            ? 'bg-green-100 text-green-700 border-green-200'
            : status === 'REJECTED' || status === 'rejected'
              ? 'bg-red-100 text-red-700 border-red-200'
              : 'bg-yellow-100 text-yellow-700 border-yellow-200'
        }`}
      >
        {String(status)}
      </div>
    </div>
  )

  const footer = (
    <>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex justify-center gap-4 shadow-lg z-10">
        {pending ? (
          <>
            <button
              type="button"
              onClick={() => setShowRejectModal(true)}
              disabled={busy}
              className="px-8 py-3 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors border border-red-200"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={approve}
              disabled={busy}
              className="px-8 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
            >
              {busy ? 'Processing…' : 'Verify & Approve'}
            </button>
          </>
        ) : (
          <p className="text-gray-500 font-medium">This submission has been processed.</p>
        )}
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Reject submission</h3>
            <p className="text-sm text-gray-500 mb-4">This reason will be sent to the applicant.</p>
            <textarea
              className="w-full p-3 border border-gray-200 rounded-xl text-sm mb-4 focus:ring-2 focus:ring-red-500 outline-none h-32 resize-none"
              placeholder="Reason for rejection…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="text-sm font-medium text-gray-500 hover:text-gray-700 px-4 py-2"
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bg-red-600 text-white text-sm font-bold px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                onClick={reject}
                disabled={!rejectReason.trim() || busy}
              >
                {busy ? 'Rejecting…' : 'Confirm reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )

  return (
    <Scope1ReviewGridReadOnly quadrants={quadrants} header={header} footer={footer} />
  )
}
