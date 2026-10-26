import { alpha, brand, supportColor } from '@shared/theme/tokens'
import type {
  ContractStatus,
  ContractStatusStyle,
  ContractMetric,
  ContractMetricToneStyle,
} from '../types/contract'

export const contractStatusStyles: Record<ContractStatus, ContractStatusStyle> = {
  RASCUNHO: { bgcolor: alpha.graphite[6], color: brand.graphite[500] },
  EM_REVISAO: { bgcolor: supportColor.warningSoft, color: brand.semantic.warning },
  AGUARDANDO_ASSINATURA: { bgcolor: supportColor.infoSoft, color: brand.semantic.info },
  ASSINADO: { bgcolor: alpha.magenta[8], color: brand.magenta[700] },
  ATIVO: { bgcolor: supportColor.successSoft, color: brand.semantic.success },
  ENCERRADO: { bgcolor: alpha.graphite[8], color: brand.neutral[500] },
  CANCELADO: { bgcolor: alpha.error[10], color: brand.semantic.error },
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
