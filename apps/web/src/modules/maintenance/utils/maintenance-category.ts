import {
  type MaintenanceCategory,
  maintenanceCategoryKeys,
} from '@shared/lib/utils/maintenance-categories'

export function formatMaintenanceCategory(
  value: MaintenanceCategory,
  translate: (key: string) => string,
): string {
  return translate(maintenanceCategoryKeys[value])
}
