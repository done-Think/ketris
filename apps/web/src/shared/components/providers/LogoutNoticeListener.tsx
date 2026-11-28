'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'

import { localOnlyLogoutEvent } from '@shared/lib/auth/session-lifecycle'

const NOTICE_DURATION_MS = 8000

export function LogoutNoticeListener() {
  const t = useTranslations('common.sessionNotice')
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    const show = () =>
      enqueueSnackbar(t('endedOnlyOnThisDevice'), {
        variant: 'warning',
        autoHideDuration: NOTICE_DURATION_MS,
      })
    window.addEventListener(localOnlyLogoutEvent, show)
    return () => window.removeEventListener(localOnlyLogoutEvent, show)
  }, [enqueueSnackbar, t])

  return null
}
