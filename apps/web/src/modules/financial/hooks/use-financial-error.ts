import { useTranslations } from 'next-intl'
import { useCallback } from 'react'

import { getApiErrorCode } from '@shared/utils/error-message'

import { chargeErrorKeys } from '../config/charge-status'

export function useFinancialError() {
  const t = useTranslations('charges.errors')

  return useCallback(
    (error: unknown, fallbackKey: string) => {
      const code = getApiErrorCode(error)
      const key = code ? chargeErrorKeys[code] : undefined
      return t(key ?? fallbackKey)
    },
    [t],
  )
}
