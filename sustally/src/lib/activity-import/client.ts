import type { ActivityImportSector } from '@/lib/activity-import/parse-excel'

export type ActivityImportResponse = {
  sector: ActivityImportSector
  activityData: Record<string, unknown[]>
  imported: number
  warnings: string[]
}

export async function uploadActivityExcel(
  sector: ActivityImportSector,
  file: File,
): Promise<ActivityImportResponse> {
  const fd = new FormData()
  fd.append('file', file)
  const r = await fetch(`/api/v1/activity-import?sector=${sector}`, { method: 'POST', body: fd })
  const data = await r.json()
  if (!r.ok) {
    throw new Error(data?.error ?? 'Excel import failed.')
  }
  return data as ActivityImportResponse
}
