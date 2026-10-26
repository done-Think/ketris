import { useFormatter, useTranslations } from 'next-intl'
import type { CrmFormatters } from '../types/formatters'

export function useCrmFormatter(): CrmFormatters {
  const formatter = useFormatter()
  const t = useTranslations('crm.formatting')
  return {
    money(value, monthly = false) {
      const amount = formatter.number(value, {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })
      return monthly ? t('monthlyAmount', { amount }) : amount
    },
    date: (value) =>
      formatter.dateTime(new Date(value), {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }),
    relative: (value) => formatter.relativeTime(new Date(value), new Date()),
    number: (value) => formatter.number(value),
  }
}
