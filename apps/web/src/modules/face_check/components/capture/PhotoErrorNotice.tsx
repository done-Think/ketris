'use client'

import { Alert } from '@mui/material'
import { useTranslations } from 'next-intl'

import { ErrorNotice } from '../ui'
import { ApiError } from '../../services/api-error'
import type { ApiErrorCode } from '../../types'

import type { PhotoErrorNoticeProps } from '../../types/capture.types'

const rejectionCodes: ApiErrorCode[] = ['PHOTO_REJECTED', 'LIVENESS_FAILED']

export function PhotoErrorNotice({ error }: PhotoErrorNoticeProps) {
  const t = useTranslations('face_check.capture.live.issues')

  const rejected = error instanceof ApiError && rejectionCodes.includes(error.code)
  if (rejected && error.reason) {
    return (
      <Alert severity="warning" variant="outlined">
        {t.has(error.reason) ? t(error.reason) : error.message}
      </Alert>
    )
  }

  return <ErrorNotice error={error} />
}
