import {
  maintenanceCategoryKeys,
  normalizeMaintenanceCategory,
} from '@server/maintenance/constants/maintenance-categories'

export function formatMaintenanceCategory(
  value: string,
  translate: (key: string) => string,
): string {
  const code = normalizeMaintenanceCategory(value)
  const key = Object.entries(maintenanceCategoryKeys).find(([key]) => key === code)?.[1]
  return key ? translate(key) : value
}
