import { alpha, brand, supportColor } from '@shared/theme/tokens'
import type {
  ContractStatus,
  ContractStatusStyle,
  ContractMetric,
  ContractMetricToneStyle,
} from '../types/contract'

export const contractStatusStyles: Record<ContractStatus, ContractStatusStyle> = {
  DRAFT: { bgcolor: alpha.graphite[6], color: brand.graphite[500] },
  IN_REVIEW: { bgcolor: supportColor.warningSoft, color: brand.semantic.warning },
  AWAITING_SIGNATURE: { bgcolor: supportColor.infoSoft, color: brand.semantic.info },
  SIGNED: { bgcolor: alpha.magenta[8], color: brand.magenta[700] },
  ACTIVE: { bgcolor: supportColor.successSoft, color: brand.semantic.success },
  CLOSED: { bgcolor: alpha.graphite[8], color: brand.neutral[500] },
  CANCELED: { bgcolor: alpha.error[10], color: brand.semantic.error },
}

export const contractMetricToneStyles: Record<ContractMetric['tone'], ContractMetricToneStyle> = {
  primary: {
    bgcolor: alpha.magenta[8],
    color: brand.magenta[700],
    borderColor: alpha.magenta[14],
  },
  info: {
    bgcolor: supportColor.infoSoft,
    color: brand.semantic.info,
    borderColor: alpha.graphite[8],
  },
  warning: {
    bgcolor: supportColor.warningSoft,
    color: brand.semantic.warning,
    borderColor: alpha.graphite[8],
  },
  success: {
    bgcolor: supportColor.successSoft,
    color: brand.semantic.success,
    borderColor: alpha.graphite[8],
  },
}
