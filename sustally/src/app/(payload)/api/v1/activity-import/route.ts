import { NextResponse } from 'next/server'

import { parseActivityExcel, type ActivityImportSector } from '@/lib/activity-import/parse-excel'

const SECTORS: ActivityImportSector[] = ['cement', 'oil_gas', 'pulp_paper']

export async function POST(req: Request) {
  const sector = new URL(req.url).searchParams.get('sector') as ActivityImportSector | null
  if (!sector || !SECTORS.includes(sector)) {
    return NextResponse.json({ error: 'Invalid or missing sector query (cement, oil_gas, pulp_paper).' }, { status: 400 })
  }

  const form = await req.formData()
  const file = form.get('file')
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Missing file upload.' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const parsed = await parseActivityExcel(buffer, sector)

  return NextResponse.json({
    sector,
    activityData: parsed.activityData,
    imported: parsed.imported,
    warnings: parsed.warnings,
  })
}
