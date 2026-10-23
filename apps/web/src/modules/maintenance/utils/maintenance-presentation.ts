import { brand, maintenanceColor } from '@shared/theme/tokens'
import type {
  MaintenanceStatus,
  MaintenanceStatusStyle,
  MaintenancePriority,
} from '../types/maintenance'

export const statusStyles: Record<MaintenanceStatus, MaintenanceStatusStyle> = {
  inProgress: { bgcolor: maintenanceColor.warningBackground, color: maintenanceColor.warningText },
  open: { bgcolor: maintenanceColor.infoBackground, color: maintenanceColor.infoText },
  resolved: { bgcolor: maintenanceColor.successBackground, color: brand.semantic.success },
  closed: { bgcolor: maintenanceColor.neutralBackground, color: brand.neutral[500] },
  pendingConfirmation: {
    bgcolor: maintenanceColor.infoBackground,
    color: maintenanceColor.infoText,
  },
  contested: { bgcolor: maintenanceColor.errorBackground, color: maintenanceColor.errorText },
  cancelled: { bgcolor: maintenanceColor.neutralBackground, color: brand.neutral[500] },
}
export const priorityColors: Record<MaintenancePriority, string> = {
  urgent: brand.semantic.error,
  high: maintenanceColor.priorityHigh,
  normal: brand.neutral[400],
}
