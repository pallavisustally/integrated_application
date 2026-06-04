'use client'

import { AccessibleTextField } from '@/lib/ui/form-fields'

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type ReportSignoffOrg = {
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  contactRole?: string
}

export function ReportSignoffPanel({
  organization,
  auditMetadata,
  onPatch,
  showHints = true,
}: {
  organization: ReportSignoffOrg
  auditMetadata?: { preparedBy?: string; notes?: string }
  onPatch: (patch: {
    contactName?: string
    contactEmail?: string
    contactPhone?: string
    contactRole?: string
    notes?: string
  }) => void
  showHints?: boolean
}) {
  const email = (organization.contactEmail ?? '').trim()
  const emailOk = !email || emailRe.test(email)
  const hasContact = !!(organization.contactName ?? '').trim()

  return (
    <div className="form-card report-signoff-panel">
      <h2>Report sign-off</h2>
      <p className="form-sub">
        Optional before export. Record who prepared this inventory and any assurance notes. Saved with JSON exports
        and shown in audit metadata.
      </p>
      {showHints && !hasContact ? (
        <p className="form-sub callout-neutral" role="status">
          No sign-off contact yet. You can still export; add details here if auditors or internal reviewers need a
          named owner.
        </p>
      ) : null}
      <div className="field-row">
        <AccessibleTextField
          label="Prepared by"
          value={organization.contactName ?? auditMetadata?.preparedBy ?? ''}
          placeholder="e.g. Head of Sustainability"
          onChange={(v) => onPatch({ contactName: v })}
        />
        <AccessibleTextField
          label="Work email"
          type="email"
          value={organization.contactEmail ?? ''}
          placeholder="name@company.com"
          error={email && !emailOk ? 'Enter a valid email address.' : undefined}
          onChange={(v) => onPatch({ contactEmail: v })}
        />
      </div>
      <div className="field-row">
        <AccessibleTextField
          label="Phone"
          value={organization.contactPhone ?? ''}
          placeholder="+91 98xxxxxxxx"
          onChange={(v) => onPatch({ contactPhone: v })}
        />
        <AccessibleTextField
          label="Role / designation"
          value={organization.contactRole ?? ''}
          placeholder="e.g. ESG Reporting Manager"
          onChange={(v) => onPatch({ contactRole: v })}
        />
      </div>
      <label className="field">
        <span className="field-title">Assurance / export notes</span>
        <textarea
          rows={3}
          value={auditMetadata?.notes ?? ''}
          placeholder="e.g. Draft for internal review; pending third-party verification"
          onChange={(e) => onPatch({ notes: e.target.value })}
        />
      </label>
    </div>
  )
}
