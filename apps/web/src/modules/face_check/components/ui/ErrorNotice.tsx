'use client'

import { Alert } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { ErrorNoticeProps } from '../../types'
import { extractErrorCode } from '../../utils/error-code'
import { ApiError } from '../../services/api-error'

export function ErrorNotice({ error }: ErrorNoticeProps) {
  const t = useTranslations('face_check.common.errors')

  return (
    <Alert severity="error" variant="outlined">
      {t.has(extractErrorCode(error))
        ? t(extractErrorCode(error))
        : error instanceof ApiError && error.message !== error.code
          ? error.message
          : t('UNKNOWN')}
    </Alert>
  )
}
