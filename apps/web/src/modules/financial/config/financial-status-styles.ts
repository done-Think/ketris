import { alpha, brand, supportColor } from '@shared/theme/tokens'

import type { ChargeStatusStyle } from '../types/charge'
import type { FinancialKpiTone } from '../types/financial-entry'

export const financialKpiToneStyles: Record<FinancialKpiTone, ChargeStatusStyle> = {
  success: { bgcolor: supportColor.successSoft, color: brand.semantic.success },
  warning: { bgcolor: supportColor.warningSoft, color: brand.semantic.warning },
  error: { bgcolor: alpha.error[10], color: brand.semantic.error },
  info: { bgcolor: alpha.graphite[6], color: brand.neutral[500] },
}
