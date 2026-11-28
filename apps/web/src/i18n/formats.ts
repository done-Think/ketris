export const formats = {
  dateTime: {
    short: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
    weekdayDayTime: {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    },
  },
  number: {
    currency: currencyOptions,
  },
} as const

export const defaultTimeZone = 'America/Sao_Paulo'
import { currencyOptions } from '@shared/config/currency'
