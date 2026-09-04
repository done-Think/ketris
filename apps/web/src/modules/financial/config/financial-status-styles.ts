import { alpha, brand, supportColor } from '@shared/theme/tokens'

import type {
  FinancialEntryStatus,
  FinancialKpiTone,
  FinancialStatusStyle,
} from '../types/financial-entry'

export const financialStatusStyles: Record<FinancialEntryStatus, FinancialStatusStyle> = {
  Pago: { bgcolor: supportColor.successSoft, color: brand.semantic.success },
  Pendente: { bgcolor: supportColor.warningSoft, color: brand.semantic.warning },
  Atrasado: { bgcolor: supportColor.errorSoft, color: brand.semantic.error },
}

export const financialKpiToneStyles: Record<FinancialKpiTone, FinancialStatusStyle> = {
  success: { bgcolor: supportColor.successSoft, color: brand.semantic.success },
  warning: { bgcolor: supportColor.warningSoft, color: brand.semantic.warning },
  error: { bgcolor: alpha.error[10], color: brand.semantic.error },
  info: { bgcolor: alpha.graphite[6], color: brand.neutral[500] },
}
