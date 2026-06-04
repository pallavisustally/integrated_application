import type { Payload } from 'payload'

import { calculate } from '@/lib/engine/calculate'
import { calculateIronSteel } from '@/lib/engine/ironsteel'
import type { IronSteelInputPayload } from '@/lib/engine/ironsteel'
import { calculateOilGas } from '@/lib/engine/oilgas'
import type { OilGasInputPayload } from '@/lib/engine/oilgas'
import { calculatePower } from '@/lib/engine/power'
import type { PowerInputPayload } from '@/lib/engine/power'
import { calculatePulpPaper } from '@/lib/engine/pulppaper'
import type { PulpPaperInputPayload } from '@/lib/engine/pulppaper'
import type { InputPayload } from '@/lib/engine/types'
import { buildPdf } from '@/lib/report/pdf'
import { buildWorkbook } from '@/lib/report/workbook'
import { buildIronSteelPdf } from '@/lib/report/ironsteel-pdf'
import { buildIronSteelWorkbook } from '@/lib/report/ironsteel-workbook'
import { buildOilGasPdf } from '@/lib/report/oilgas-pdf'
import { buildOilGasWorkbook } from '@/lib/report/oilgas-workbook'
import { buildPowerPdf } from '@/lib/report/power-pdf'
import { buildPowerWorkbook } from '@/lib/report/power-workbook'
import { buildPulpPaperPdf } from '@/lib/report/pulppaper-pdf'
import { buildPulpPaperWorkbook } from '@/lib/report/pulppaper-workbook'

type Scope1SectorCode = 'CEMENT' | 'OIL_GAS' | 'PULP_PAPER' | 'POWER' | 'IRON_STEEL'

function safeBaseName(name: string, prefix: string, year: number): string {
  const safe = name
    .replace(/[^\x20-\x7E]/g, '_')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
  return `${prefix}-${safe}-FY${year}`
}

async function uploadBuffer(
  cms: Payload,
  buffer: Buffer,
  filename: string,
  mimetype: string,
  alt: string,
): Promise<string | null> {
  try {
    const media = await cms.create({
      collection: 'media',
      data: { alt },
      file: {
        data: buffer,
        mimetype,
        name: filename,
        size: buffer.length,
      },
    })
    const url = (media as { url?: string }).url
    if (url) return url
    const server =
      process.env.PAYLOAD_PUBLIC_SERVER_URL?.replace(/\/$/, '') ||
      'http://localhost:3001'
    return `${server}/media/${filename}`
  } catch (err) {
    console.error('[scope1-generator] Media upload failed:', err)
    return null
  }
}

export async function generateScope1Reports(
  cms: Payload,
  doc: {
    id: string
    sectorCode: Scope1SectorCode
    inputPayload: unknown
    result?: unknown
    assessmentId?: string
  },
): Promise<{ reportUrl?: string; dashboardUrl?: string }> {
  const input = doc.inputPayload as Record<string, unknown>
  const sector = doc.sectorCode
  const appBase = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(
    /\/$/,
    '',
  )
  const dashboardUrl = `${appBase}/dashboard?assessmentId=${encodeURIComponent(doc.assessmentId || '')}`

  let pdfBuf: Buffer
  let xlsxBuf: Buffer
  let base: string

  switch (sector) {
    case 'CEMENT': {
      const payload = input as unknown as InputPayload
      const result = doc.result
        ? (doc.result as ReturnType<typeof calculate>)
        : calculate(payload)
      base = safeBaseName(
        payload.facility?.name ?? 'facility',
        'scope1',
        result.reportingPeriod.year,
      )
      pdfBuf = Buffer.from(await buildPdf(payload, result))
      xlsxBuf = Buffer.from(await buildWorkbook(payload, result))
      break
    }
    case 'OIL_GAS': {
      const payload = input as unknown as OilGasInputPayload
      const result = calculateOilGas(payload)
      base = safeBaseName(payload.facility?.name ?? 'facility', 'scope1-oilgas', result.reportingPeriod.year)
      pdfBuf = Buffer.from(await buildOilGasPdf(payload, result))
      xlsxBuf = Buffer.from(await buildOilGasWorkbook(payload, result))
      break
    }
    case 'PULP_PAPER': {
      const payload = input as unknown as PulpPaperInputPayload
      const result = calculatePulpPaper(payload)
      base = safeBaseName(payload.facility?.name ?? 'facility', 'scope1-pulp', result.reportingPeriod.year)
      pdfBuf = Buffer.from(await buildPulpPaperPdf(payload, result))
      xlsxBuf = Buffer.from(await buildPulpPaperWorkbook(payload, result))
      break
    }
    case 'POWER': {
      const payload = input as unknown as PowerInputPayload
      const result = calculatePower(payload)
      base = safeBaseName(payload.facility?.name ?? 'facility', 'scope1-power', result.reportingPeriod.year)
      pdfBuf = Buffer.from(await buildPowerPdf(payload, result))
      xlsxBuf = Buffer.from(await buildPowerWorkbook(payload, result))
      break
    }
    case 'IRON_STEEL': {
      const payload = input as unknown as IronSteelInputPayload
      const result = calculateIronSteel(payload)
      base = safeBaseName(payload.facility?.name ?? 'facility', 'scope1-steel', result.reportingPeriod.year)
      pdfBuf = Buffer.from(await buildIronSteelPdf(payload, result))
      xlsxBuf = Buffer.from(await buildIronSteelWorkbook(payload, result))
      break
    }
    default:
      return { dashboardUrl }
  }

  const pdfUrl = await uploadBuffer(cms, pdfBuf, `${base}.pdf`, 'application/pdf', `Scope 1 PDF ${base}`)
  await uploadBuffer(
    cms,
    xlsxBuf,
    `${base}.xlsx`,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    `Scope 1 workbook ${base}`,
  )

  return {
    reportUrl: pdfUrl || undefined,
    dashboardUrl,
  }
}
