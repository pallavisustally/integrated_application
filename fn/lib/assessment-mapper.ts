/**
 * Maps unified assessment booking fields to Scope 1 / Scope 2 form shapes.
 * See docs/FIELD_MAPPING.md for the full table.
 */

import type { AssessmentSession } from './assessment-session'
import { OPERATING_COUNTRIES } from './ui/countries'

export type Scope1SectorCode =
  | 'CEMENT'
  | 'OIL_GAS'
  | 'PULP_PAPER'
  | 'POWER'
  | 'IRON_STEEL'

export type ConsolidationApproach = 'Operational Control' | 'Equity Share' | 'Financial Control'

export type Scope1BoundaryMethod = 'OPERATIONAL_CONTROL' | 'FINANCIAL_CONTROL' | 'EQUITY_SHARE'

export function mapBookingConsolidationToScope1(
  approach?: string | null,
): Scope1BoundaryMethod | null {
  const text = approach?.trim()
  if (!text) return null
  if (/operational/i.test(text)) return 'OPERATIONAL_CONTROL'
  if (/equity/i.test(text)) return 'EQUITY_SHARE'
  if (/financial/i.test(text)) return 'FINANCIAL_CONTROL'
  return null
}

export function mapBookingCountryToScope1(country?: string | null): string {
  const text = country?.trim()
  if (!text) return 'IN'
  if (/^india$/i.test(text)) return 'IN'
  const match = OPERATING_COUNTRIES.find(
    (c) =>
      c.label.toLowerCase() === text.toLowerCase() ||
      c.code.toLowerCase() === text.toLowerCase(),
  )
  if (match) return match.code
  return 'GLOBAL'
}

export function mapScope1CountryToPower(code: string): string {
  if (code === 'GB') return 'UK'
  if (['DE', 'FR', 'IT', 'ES', 'NL', 'PL'].includes(code)) return 'EU'
  if (code === 'GLOBAL') return 'OTHER'
  if (['IN', 'US', 'CN', 'AU', 'JP'].includes(code)) return code
  return 'OTHER'
}

export type CalculatorSector = 'cement' | 'oil_gas' | 'pulp_paper' | 'power' | 'iron_steel'

const SECTOR_HINTS: { match: RegExp; code: Scope1SectorCode; route: CalculatorSector }[] = [
  { match: /cement/i, code: 'CEMENT', route: 'cement' },
  { match: /oil\s*&?\s*gas|oil and gas/i, code: 'OIL_GAS', route: 'oil_gas' },
  { match: /pulp|paper/i, code: 'PULP_PAPER', route: 'pulp_paper' },
  { match: /power|electric|utility/i, code: 'POWER', route: 'power' },
  { match: /iron|steel/i, code: 'IRON_STEEL', route: 'iron_steel' },
]

export function mapBookingSectorToScope1(
  sector?: string | null,
): { sectorCode: Scope1SectorCode; route: CalculatorSector } | null {
  const text = sector?.trim()
  if (!text) return null
  for (const hint of SECTOR_HINTS) {
    if (hint.match.test(text)) return { sectorCode: hint.code, route: hint.route }
  }
  return null
}

export type OrganizationPrefill = {
  company?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  country?: string
}

export function organizationPrefillFromSession(
  session: AssessmentSession | null,
): OrganizationPrefill | null {
  if (!session) return null
  const out: OrganizationPrefill = {}
  if (session.company) out.company = session.company
  if (session.name) out.contactName = session.name
  if (session.email) out.contactEmail = session.email
  if (session.mobile) out.contactPhone = session.mobile
  if (session.country) out.country = mapBookingCountryToScope1(session.country)
  return Object.keys(out).length > 0 ? out : null
}

export function organizationPrefillFromSearchParams(
  params: URLSearchParams,
): OrganizationPrefill | null {
  const out: OrganizationPrefill = {}
  const company = params.get('company')?.trim()
  const name = params.get('name')?.trim()
  const email = params.get('email')?.trim()
  const mobile = params.get('mobile')?.trim()
  const countryParam = params.get('country')?.trim()
  const otherCountryName = params.get('otherCountryName')?.trim()
  const countryRaw = countryParam === 'Other' ? otherCountryName : countryParam
  if (company) out.company = company
  if (name) out.contactName = name
  if (email) out.contactEmail = email
  if (mobile) out.contactPhone = mobile
  if (countryRaw) out.country = mapBookingCountryToScope1(countryRaw)
  return Object.keys(out).length > 0 ? out : null
}

/** Apply prefill to cement-style organization object (mutates in place). */
export type Scope2FormPrefill = {
  assessmentId?: string
  userName?: string
  userEmail?: string
  userMobile?: string
  userCompany?: string
  sector?: string
  natureOfBusiness?: string
  siteCount?: string
  conditionalApproach?: ConsolidationApproach | ''
}

export function scope2PrefillFromSession(
  session: AssessmentSession | null,
): Scope2FormPrefill | null {
  if (!session) return null
  const out: Scope2FormPrefill = {
    assessmentId: session.assessmentId,
    userEmail: session.email,
  }
  if (session.name) out.userName = session.name
  if (session.mobile) out.userMobile = session.mobile
  if (session.company) out.userCompany = session.company
  if (session.sector) out.sector = session.sector
  if (session.natureOfBusiness) out.natureOfBusiness = session.natureOfBusiness
  if (session.siteCount) out.siteCount = session.siteCount
  if (session.conditionalApproach) out.conditionalApproach = session.conditionalApproach as ConsolidationApproach
  return out
}

export function applyScope2Prefill<T extends Scope2FormPrefill>(
  target: T,
  prefill: Scope2FormPrefill,
  onlyIfEmpty = true,
): void {
  const set = <K extends keyof Scope2FormPrefill>(key: K, value: Scope2FormPrefill[K]) => {
    if (value === undefined) return
    const current = target[key]
    if (onlyIfEmpty && typeof current === 'string' && current.trim()) return
    ;(target as Scope2FormPrefill)[key] = value
  }
  set('assessmentId', prefill.assessmentId)
  set('userName', prefill.userName)
  set('userEmail', prefill.userEmail)
  set('userMobile', prefill.userMobile)
  set('userCompany', prefill.userCompany)
  set('sector', prefill.sector)
  set('natureOfBusiness', prefill.natureOfBusiness)
  set('siteCount', prefill.siteCount)
  if (prefill.conditionalApproach !== undefined) {
    ;(target as Scope2FormPrefill).conditionalApproach = prefill.conditionalApproach
  }
}

export function applyOrganizationPrefill<
  T extends {
    name?: string
    contactName?: string
    contactEmail?: string
    contactPhone?: string
    country?: string
  },
>(org: T, prefill: OrganizationPrefill, onlyIfEmpty = true): void {
  if (prefill.company) org.name = prefill.company
  if (prefill.country) org.country = prefill.country
  if (prefill.contactName) org.contactName = prefill.contactName
  if (prefill.contactEmail) org.contactEmail = prefill.contactEmail
  if (prefill.contactPhone) org.contactPhone = prefill.contactPhone
}
