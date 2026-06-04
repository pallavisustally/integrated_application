import ExcelJS from 'exceljs'
import { NextResponse } from 'next/server'

const SECTOR_SHEETS: Record<string, { sheet: string; headers: string[] }> = {
  cement: {
    sheet: 'Cement activity',
    headers: ['category', 'label', 'fuelCode', 'quantity', 'quantityUnit', 'notes'],
  },
  oil_gas: {
    sheet: 'Oil & gas activity',
    headers: ['category', 'label', 'fuelCode', 'quantity', 'quantityUnit', 'notes'],
  },
  pulp_paper: {
    sheet: 'Pulp & paper activity',
    headers: ['category', 'label', 'fuelCode', 'quantity', 'quantityUnit', 'notes'],
  },
}

export async function GET(req: Request) {
  const sector = new URL(req.url).searchParams.get('sector') ?? 'cement'
  const def = SECTOR_SHEETS[sector] ?? SECTOR_SHEETS.cement

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(def.sheet)
  ws.addRow(def.headers)
  ws.addRow(['stationary', 'Example row', 'natural_gas', '', 'Sm3', 'Replace with plant data'])
  ws.getRow(1).font = { bold: true }

  const buf = Buffer.from(await wb.xlsx.writeBuffer())
  const filename = `activity-${sector.replace('_', '-')}-template.xlsx`

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
