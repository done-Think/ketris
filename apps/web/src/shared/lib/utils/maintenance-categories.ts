export const maintenanceCategories = [
  'PLUMBING',
  'ELECTRICAL',
  'STRUCTURAL',
  'PAINTING',
  'OTHER',
] as const

export type MaintenanceCategory = (typeof maintenanceCategories)[number]

export const maintenanceCategoryKeys = {
  PLUMBING: 'plumbing',
  ELECTRICAL: 'electrical',
  STRUCTURAL: 'structural',
  PAINTING: 'painting',
  OTHER: 'other',
} as const satisfies Record<MaintenanceCategory, string>

const legacyCategories: Record<string, MaintenanceCategory> = {
  Hidráulica: 'PLUMBING',
  Elétrica: 'ELECTRICAL',
  Estrutural: 'STRUCTURAL',
  Pintura: 'PAINTING',
}

export function isMaintenanceCategory(value: unknown): value is MaintenanceCategory {
  return typeof value === 'string' && (maintenanceCategories as readonly string[]).includes(value)
}

export function normalizeMaintenanceCategory(value: string): MaintenanceCategory | null {
  const category = legacyCategories[value] ?? value
  return isMaintenanceCategory(category) ? category : null
}
