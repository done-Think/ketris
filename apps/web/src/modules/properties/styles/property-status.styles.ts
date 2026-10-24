import { alpha, brand } from '@shared/theme/tokens'
import type {
  DashboardPropertyStatus,
  DashboardActivityTone,
  PropertyStatusStyle,
} from '../types/dashboard-property'

export const dashboardPropertyStatusStyles: Record<DashboardPropertyStatus, PropertyStatusStyle> = {
  available: { color: brand.semantic.success, bgcolor: alpha.graphite[6] },
  rented: { color: brand.semantic.info, bgcolor: alpha.graphite[6] },
  sold: { color: brand.semantic.success, bgcolor: alpha.graphite[6] },
  active: { color: brand.semantic.success, bgcolor: alpha.graphite[6] },
  inReview: { color: brand.semantic.warning, bgcolor: alpha.graphite[6] },
  expiring: { color: brand.semantic.warning, bgcolor: alpha.graphite[6] },
  inactive: { color: brand.semantic.error, bgcolor: alpha.error[10] },
}

export const dashboardPropertyActivityToneStyles: Record<DashboardActivityTone, string> = {
  success: brand.semantic.success,
  accent: brand.magenta[500],
  info: brand.semantic.info,
  warning: brand.semantic.warning,
  neutral: brand.neutral[500],
  error: brand.semantic.error,
}
