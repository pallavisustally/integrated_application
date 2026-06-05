/** Preset activity row labels — pick from list or type a custom label. */

export type LabelSuggestionSet = {
  presets: string[]
  customPlaceholder?: string
}

const CEMENT: Record<string, LabelSuggestionSet> = {
  kilnFuels: {
    presets: ['Kiln petcoke', 'Kiln coal', 'Kiln tyres (alt fuel)', 'Kiln natural gas', 'Alternative fuel mix'],
  },
  nonKilnFuels: {
    presets: ['Plant boiler', 'Backup generator', 'Drying kiln', 'Office heating'],
  },
  mobile: {
    presets: ['Front loader', 'Haul truck', 'Forklift', 'Company fleet'],
  },
  fugitive: {
    presets: ['R-410A — main chiller', 'R-134a — cold storage', 'SF6 — switchgear', 'R-22 — legacy HVAC'],
    customPlaceholder: 'e.g. R-410A — main chiller',
  },
}

const OIL_GAS: Record<string, LabelSuggestionSet> = {
  combustion: {
    presets: ['Flare stack', 'Compressor station', 'Boiler house', 'Gas turbine', 'Heater treater'],
  },
  venting: {
    presets: ['Tank venting', 'Process vent', 'Pneumatic devices', 'Dehydrator vent'],
  },
  fugitive: {
    presets: ['R-410A — HVAC', 'R-404A — refrigeration', 'SF6 — electrical'],
  },
  mobile: {
    presets: ['Service fleet', 'Off-road equipment', 'Marine vessel'],
  },
}

const PULP_PAPER: Record<string, LabelSuggestionSet> = {
  combustion: {
    presets: ['Recovery boiler', 'Power boiler', 'Lime kiln', 'Biomass boiler'],
  },
  mobile: {
    presets: ['Wood yard loader', 'Forklift', 'Chip hauler'],
  },
  fugitive: {
    presets: ['R-134a — refrigeration', 'R-410A — HVAC'],
  },
}

const IRON_STEEL: Record<string, LabelSuggestionSet> = {
  combustion: {
    presets: ['Blast furnace stove', 'Coke oven battery', 'Reheat furnace', 'BOF off-gas flare'],
  },
  process: {
    presets: ['BF-BOF route', 'EAF melt shop', 'DRI shaft furnace'],
  },
  fugitive: {
    presets: ['SF6 — switchgear', 'R-410A — HVAC'],
  },
}

const POWER: Record<string, LabelSuggestionSet> = {
  combustion: {
    presets: ['Coal unit 1', 'Gas turbine', 'Diesel backup', 'Biomass co-fire'],
  },
  fugitive: {
    presets: ['SF6 — GIS switchgear', 'R-410A — HVAC'],
  },
}

export function labelSuggestionsFor(
  sector: 'cement' | 'oil_gas' | 'pulp_paper' | 'iron_steel' | 'power',
  categoryKey: string,
): LabelSuggestionSet {
  const tables: Record<string, Record<string, LabelSuggestionSet>> = {
    cement: CEMENT,
    oil_gas: OIL_GAS,
    pulp_paper: PULP_PAPER,
    iron_steel: IRON_STEEL,
    power: POWER,
  }
  const table = tables[sector]
  return (
    table[categoryKey] ?? {
      presets: ['Source 1', 'Source 2', 'Main equipment'],
      customPlaceholder: 'Describe this emission source',
    }
  )
}
