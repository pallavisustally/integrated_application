/** Operating countries for organisation step (ISO-style codes; GLOBAL = other). */

export type CountryOption = { code: string; label: string }

export const OPERATING_COUNTRIES: CountryOption[] = [
  { code: 'IN', label: 'India' },
  { code: 'US', label: 'United States' },
  { code: 'CN', label: 'China' },
  { code: 'BR', label: 'Brazil' },
  { code: 'MX', label: 'Mexico' },
  { code: 'CA', label: 'Canada' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'IT', label: 'Italy' },
  { code: 'ES', label: 'Spain' },
  { code: 'NL', label: 'Netherlands' },
  { code: 'PL', label: 'Poland' },
  { code: 'TR', label: 'Turkey' },
  { code: 'SA', label: 'Saudi Arabia' },
  { code: 'AE', label: 'United Arab Emirates' },
  { code: 'QA', label: 'Qatar' },
  { code: 'KW', label: 'Kuwait' },
  { code: 'OM', label: 'Oman' },
  { code: 'EG', label: 'Egypt' },
  { code: 'ZA', label: 'South Africa' },
  { code: 'NG', label: 'Nigeria' },
  { code: 'ID', label: 'Indonesia' },
  { code: 'MY', label: 'Malaysia' },
  { code: 'TH', label: 'Thailand' },
  { code: 'VN', label: 'Vietnam' },
  { code: 'JP', label: 'Japan' },
  { code: 'KR', label: 'South Korea' },
  { code: 'AU', label: 'Australia' },
  { code: 'NZ', label: 'New Zealand' },
  { code: 'AR', label: 'Argentina' },
  { code: 'CL', label: 'Chile' },
  { code: 'CO', label: 'Colombia' },
  { code: 'PE', label: 'Peru' },
  { code: 'RU', label: 'Russia' },
  { code: 'GLOBAL', label: 'Other / multiple countries' },
]

export function countryLabel(code: string): string {
  return OPERATING_COUNTRIES.find((c) => c.code === code)?.label ?? code.replace(/_/g, ' ')
}
