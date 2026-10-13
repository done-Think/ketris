import { brand, supportColor } from '@shared/theme/tokens'
import type { ChargeStatus } from '../types/charge'

export const chargeStatusColors: Record<ChargeStatus, { bg: string; color: string }> = {
  paid: { bg: supportColor.successSoft, color: brand.semantic.success },
  pending: { bg: supportColor.warningSoft, color: brand.semantic.warning },
  overdue: { bg: supportColor.errorSoft, color: brand.semantic.error },
  scheduled: { bg: supportColor.infoSoft, color: brand.semantic.info },
  cancelled: { bg: brand.neutral[100], color: brand.neutral[500] },
}
