/** Sector-specific sustally export routes for Scope 1 dashboards. */

export type Scope1ExportFormat = 'json' | 'xlsx' | 'pdf'

export function scope1ExportPath(sectorCode?: string | null): string {
  switch (sectorCode) {
    case 'OIL_GAS':
      return '/api/v1/calculations/oil-gas/export'
    case 'PULP_PAPER':
      return '/api/v1/calculations/pulp-paper/export'
    case 'POWER':
      return '/api/v1/calculations/power/export'
    case 'IRON_STEEL':
      return '/api/v1/calculations/iron-steel/export'
    case 'CEMENT':
    default:
      return '/api/v1/calculations/export'
  }
}
