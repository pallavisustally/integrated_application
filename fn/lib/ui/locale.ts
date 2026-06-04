/** Browser-aware number formatting for inventory UI. */

export function numberLocale(): string {
  if (typeof navigator !== 'undefined' && navigator.language) return navigator.language
  return 'en'
}

export function formatNumber(value: number, maximumFractionDigits = 2): string {
  return value.toLocaleString(numberLocale(), { maximumFractionDigits })
}
