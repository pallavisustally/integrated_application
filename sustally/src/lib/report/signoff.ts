import { countryLabel } from '@/lib/ui/countries'

export type ReportSignoffInput = {
  organization: {
    name: string
    country?: string
    contactName?: string
    contactEmail?: string
    contactPhone?: string
    contactRole?: string
  }
  auditMetadata?: { preparedBy?: string; notes?: string }
}

/** Rows for Excel summary / PDF sign-off block. */
export function signoffRows(input: ReportSignoffInput): Array<[string, string]> {
  const o = input.organization
  const prepared = (input.auditMetadata?.preparedBy ?? o.contactName ?? '').trim()
  return [
    ['Prepared by', prepared || 'Not recorded'],
    ['Work email', (o.contactEmail ?? '').trim() || 'Not recorded'],
    ['Phone', (o.contactPhone ?? '').trim() || 'Not recorded'],
    ['Role', (o.contactRole ?? '').trim() || 'Not recorded'],
    ['Operating country', o.country ? countryLabel(o.country) : 'Not recorded'],
    ['Assurance / export notes', (input.auditMetadata?.notes ?? '').trim() || 'None'],
  ]
}

export function hasSignoffContact(input: ReportSignoffInput): boolean {
  const o = input.organization
  return Boolean(
    (input.auditMetadata?.preparedBy ?? o.contactName ?? '').trim() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((o.contactEmail ?? '').trim()),
  )
}
