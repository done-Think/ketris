export const maintenanceCategoryKeys = {
  PLUMBING: 'plumbing',
  ELECTRICAL: 'electrical',
  STRUCTURAL: 'structural',
  PAINTING: 'painting',
} as const

const legacyCategories: Record<string, keyof typeof maintenanceCategoryKeys> = {
  Hidráulica: 'PLUMBING',
  Elétrica: 'ELECTRICAL',
  Estrutural: 'STRUCTURAL',
  Pintura: 'PAINTING',
}

export function normalizeMaintenanceCategory(category: string): string {
  return legacyCategories[category] ?? category
}
