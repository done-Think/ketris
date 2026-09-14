export const formats = {
  dateTime: {
    short: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  },
  number: {
    currency: {
      style: 'currency',
      currency: 'BRL',
    },
  },
} as const

export const defaultTimeZone = 'America/Sao_Paulo'
