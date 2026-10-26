import type { ApiMaintenanceTicketCategory } from '../types/service'

export const MAINTENANCE_CATEGORIES: readonly ApiMaintenanceTicketCategory[] = [
  'PLUMBING',
  'ELECTRICAL',
  'STRUCTURAL',
  'PAINTING',
  'OTHER',
]

// Drafts saved before categories became codes still hold the old Portuguese labels.
const LEGACY_CATEGORY_LABELS: Record<string, ApiMaintenanceTicketCategory> = {
  Hidráulica: 'PLUMBING',
  Elétrica: 'ELECTRICAL',
  Estrutural: 'STRUCTURAL',
  Pintura: 'PAINTING',
}

export function isMaintenanceCategory(value: string): value is ApiMaintenanceTicketCategory {
  return (MAINTENANCE_CATEGORIES as readonly string[]).includes(value)
}

export function normalizeDraftCategory(value: string): ApiMaintenanceTicketCategory | '' {
  if (isMaintenanceCategory(value)) return value
  return LEGACY_CATEGORY_LABELS[value] ?? ''
}
