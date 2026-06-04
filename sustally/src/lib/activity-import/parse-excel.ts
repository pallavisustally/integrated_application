import ExcelJS from 'exceljs'

export type ActivityImportSector = 'cement' | 'oil_gas' | 'pulp_paper'

export type ActivityImportResult = {
  activityData: Record<string, unknown[]>
  imported: number
  warnings: string[]
}

const SECTOR_CATEGORY_MAP: Record<ActivityImportSector, Record<string, string>> = {
  cement: {
    kiln: 'kilnFuels',
    kilnfuels: 'kilnFuels',
    'kiln fuels': 'kilnFuels',
    stationary: 'kilnFuels',
    nonkiln: 'nonKilnFuels',
    'non-kiln': 'nonKilnFuels',
    nonkilnfuels: 'nonKilnFuels',
    mobile: 'mobile',
    fugitive: 'fugitive',
  },
  oil_gas: {
    stationary: 'stationaryCombustion',
    stationarycombustion: 'stationaryCombustion',
    mobile: 'mobileCombustion',
    mobilecombustion: 'mobileCombustion',
    flare: 'flaring',
    flaring: 'flaring',
    vent: 'venting',
    venting: 'venting',
    fugitive: 'fugitiveComponents',
    fugitivecomponents: 'fugitiveComponents',
    refrigerant: 'refrigerants',
    refrigerants: 'refrigerants',
    process: 'process',
    reported: 'reported',
  },
  pulp_paper: {
    stationary: 'stationaryCombustion',
    stationarycombustion: 'stationaryCombustion',
    biomass: 'biomassCombustion',
    biomasscombustion: 'biomassCombustion',
    lime: 'limeKilns',
    limekiln: 'limeKilns',
    limekilns: 'limeKilns',
    makeup: 'makeupCarbonates',
    makeupcarbonates: 'makeupCarbonates',
    mobile: 'mobile',
    landfill: 'landfills',
    landfills: 'landfills',
    wwt: 'anaerobicWwt',
    anaerobicwwt: 'anaerobicWwt',
    refrigerant: 'refrigerants',
    refrigerants: 'refrigerants',
    chp: 'chpAllocation',
    chpallocation: 'chpAllocation',
    transfer: 'co2Transfers',
    co2transfers: 'co2Transfers',
    reported: 'reported',
  },
}

function cellStr(v: ExcelJS.CellValue): string {
  if (v == null) return ''
  if (typeof v === 'object' && 'text' in v && typeof (v as { text: string }).text === 'string') {
    return (v as { text: string }).text.trim()
  }
  return String(v).trim()
}

function cellNum(v: ExcelJS.CellValue): number | null {
  const s = cellStr(v)
  if (s === '') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `imp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function normalizeCategory(sector: ActivityImportSector, raw: string): string | null {
  const key = raw.trim().toLowerCase().replace(/\s+/g, '')
  return SECTOR_CATEGORY_MAP[sector][key] ?? SECTOR_CATEGORY_MAP[sector][raw.trim().toLowerCase()] ?? null
}

function buildEntry(
  sector: ActivityImportSector,
  target: string,
  row: Record<string, string>,
): Record<string, unknown> | null {
  const label = row.label || row.name || 'Imported row'
  const qty = cellNum(row.quantity)
  const unit = row.quantityunit || row.unit || 'tonne'
  const notes = row.notes || row.evidence || ''
  const fuel = row.fuelcode || row.fuel || 'natural_gas'
  const id = newId()

  if (sector === 'cement') {
    if (target === 'mobile') {
      return {
        id,
        label,
        ownership: (row.ownership || 'OWNED_CONTROLLED') as 'OWNED_CONTROLLED' | 'THIRD_PARTY',
        fuelCode: fuel,
        quantity: qty,
        quantityUnit: unit,
        overrideReason: notes || undefined,
      }
    }
    if (target === 'fugitive') {
      return {
        id,
        label,
        gasCode: row.gascode || row.gas || 'r410a',
        leakedKg: qty,
        overrideReason: notes || undefined,
      }
    }
    return {
      id,
      label,
      fuelCode: fuel,
      category: (row.category || 'CONVENTIONAL_FOSSIL') as string,
      quantity: qty,
      quantityUnit: unit,
      overrideReason: notes || undefined,
    }
  }

  if (sector === 'oil_gas') {
    if (target === 'mobileCombustion') {
      return {
        id,
        label,
        ownership: (row.ownership || 'OWNED_CONTROLLED') as 'OWNED_CONTROLLED' | 'THIRD_PARTY',
        fuelCode: fuel,
        quantity: qty,
        quantityUnit: unit,
        overrideReason: notes || undefined,
      }
    }
    if (target === 'refrigerants') {
      return {
        id,
        label,
        gasCode: row.gascode || 'r410a',
        leakedKg: qty,
        tier: 'TOP_DOWN' as const,
        overrideReason: notes || undefined,
      }
    }
    if (target === 'stationaryCombustion') {
      return {
        id,
        label,
        fuelCode: fuel,
        category: (row.emissioncategory || row.category || 'CONVENTIONAL_FOSSIL') as string,
        quantity: qty,
        quantityUnit: unit,
        overrideReason: notes || undefined,
      }
    }
    return {
      id,
      label,
      fuelCode: fuel,
      quantity: qty,
      quantityUnit: unit,
      overrideReason: notes || undefined,
    }
  }

  // pulp_paper
  if (target === 'mobile') {
    return {
      id,
      label,
      ownership: (row.ownership || 'OWNED_CONTROLLED') as 'OWNED_CONTROLLED' | 'THIRD_PARTY',
      vehicleCode: row.vehiclecode || row.fuelcode || 'DIESEL_OFFROAD',
      quantity: qty,
      quantityUnit: unit,
      overrideReason: notes || undefined,
    }
  }
  if (target === 'refrigerants') {
    return {
      id,
      label,
      gasCode: row.gascode || 'r410a',
      leakedKg: qty,
      overrideReason: notes || undefined,
    }
  }
  if (target === 'stationaryCombustion' || target === 'biomassCombustion') {
    return {
      id,
      label,
      fuelCode: fuel,
      technology: row.technology || 'BOILER_OR_IR_DRYER',
      quantity: qty,
      quantityUnit: unit,
      overrideReason: notes || undefined,
    }
  }
  return {
    id,
    label,
    fuelCode: fuel,
    quantity: qty,
    quantityUnit: unit,
    overrideReason: notes || undefined,
  }
}

export async function parseActivityExcel(
  buffer: ArrayBuffer | Buffer,
  sector: ActivityImportSector,
): Promise<ActivityImportResult> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer as ExcelJS.Buffer)
  const sheet = wb.worksheets[0]
  if (!sheet) {
    return { activityData: {}, imported: 0, warnings: ['Workbook has no sheets.'] }
  }

  const headerRow = sheet.getRow(1)
  const headers: string[] = []
  headerRow.eachCell((cell, col) => {
    headers[col - 1] = cellStr(cell.value).toLowerCase().replace(/\s+/g, '')
  })

  const activityData: Record<string, unknown[]> = {}
  const warnings: string[] = []
  let imported = 0

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const record: Record<string, string> = {}
    let hasData = false
    row.eachCell((cell, col) => {
      const h = headers[col - 1]
      if (!h) return
      const v = cellStr(cell.value)
      if (v) hasData = true
      record[h] = v
    })
    if (!hasData) return

    const catRaw = record.category || record.cat || ''
    const target = normalizeCategory(sector, catRaw)
    if (!target) {
      warnings.push(`Row ${rowNumber}: unknown category "${catRaw}".`)
      return
    }

    const entry = buildEntry(sector, target, record)
    if (!entry) {
      warnings.push(`Row ${rowNumber}: could not build entry.`)
      return
    }

    if (!activityData[target]) activityData[target] = []
    activityData[target].push(entry)
    imported++
  })

  return { activityData, imported, warnings }
}

export function mergeImportedActivity<T extends object>(
  base: T,
  imported: Record<string, unknown[]>,
): T {
  const next = { ...base } as T & Record<string, unknown[]>
  for (const [key, rows] of Object.entries(imported)) {
    const existing = (next as Record<string, unknown[]>)[key]
    if (Array.isArray(existing)) {
      ;(next as Record<string, unknown[]>)[key] = [...existing, ...rows]
    } else if (rows.length > 0) {
      ;(next as Record<string, unknown[]>)[key] = rows
    }
  }
  return next as T
}
