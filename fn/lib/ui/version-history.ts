import type { CalculatorSector } from '@/lib/ui/draft-detect'

const KEY_PREFIX = 'sustally:inventory-versions:'

export type InventoryVersionSnapshot = {
  id: string
  savedAt: string
  label: string
  grossScope1: number
  status: string
  payload: unknown
}

function storageKey(sector: CalculatorSector): string {
  return `${KEY_PREFIX}${sector}`
}

export function listInventoryVersions(sector: CalculatorSector): InventoryVersionSnapshot[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey(sector))
    if (!raw) return []
    return JSON.parse(raw) as InventoryVersionSnapshot[]
  } catch {
    return []
  }
}

export function saveInventoryVersion(
  sector: CalculatorSector,
  snap: Omit<InventoryVersionSnapshot, 'id' | 'savedAt'>,
): InventoryVersionSnapshot {
  const entry: InventoryVersionSnapshot = {
    ...snap,
    id: `v_${Date.now()}`,
    savedAt: new Date().toISOString(),
  }
  const prev = listInventoryVersions(sector)
  const next = [entry, ...prev].slice(0, 8)
  try {
    localStorage.setItem(storageKey(sector), JSON.stringify(next))
  } catch {
    /* quota */
  }
  return entry
}

export function compareGrossDelta(a: number, b: number): number {
  if (a === 0) return b === 0 ? 0 : 100
  return ((b - a) / a) * 100
}
