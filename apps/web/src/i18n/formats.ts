export const formats = {
  dateTime: {
    short: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  },
  number: {
    currency: currencyOptions,
  },
} as const

export const defaultTimeZone = 'America/Sao_Paulo'
import { currencyOptions } from '@shared/config/currency'
