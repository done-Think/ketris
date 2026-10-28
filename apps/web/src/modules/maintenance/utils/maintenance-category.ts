import {
  type MaintenanceCategory,
  maintenanceCategoryKeys,
} from '@shared/lib/utils/maintenance-categories'

export function formatMaintenanceCategory(
  value: MaintenanceCategory,
  translate: (key: TranslationKey<'dashboard.maintenance.categories'>) => string,
): string {
  return translate(maintenanceCategoryKeys[value])
}
import type { TranslationKey } from '@/i18n/types/messages.types'
