import { contractOptionMessage } from '../utils/contract-option-message'
import { useFormatter, useTranslations } from 'next-intl'
import type { ContractPresentation } from '../types/presentation'

export function useContractPresentation(): ContractPresentation {
  const formatter = useFormatter()
  const conditions = useTranslations('contracts.wizard.conditions')
  const detail = useTranslations('contracts.detail')
  return {
    date: (value) => formatter.dateTime(new Date(value), { dateStyle: 'short', timeZone: 'UTC' }),
    money: (value) => formatter.number(value, { style: 'currency', currency: 'BRL' }),
    adjustment: (value) => conditions(contractOptionMessage('adjustmentIndexOptions', value)),
    guarantee: (value) => conditions(contractOptionMessage('guaranteeTypeOptions', value)),
    paymentDay: (day) => detail('paymentDay', { day }),
  }
}
