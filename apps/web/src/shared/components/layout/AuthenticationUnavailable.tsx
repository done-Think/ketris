'use client'

import { useState } from 'react'
import { Button, Typography } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { useRouter } from '@/i18n/navigation'
import { AuthUnavailableContent } from './auth-availability.styles'

export function AuthenticationUnavailable() {
  const t = useTranslations('common.authUnavailable')
  const { update } = useSession()
  const router = useRouter()
  const [retrying, setRetrying] = useState(false)

  async function retry() {
    setRetrying(true)
    try {
      const session = await update()
      if (!session?.authUnavailable) router.refresh()
    } catch {
    } finally {
      setRetrying(false)
    }
  }

  return (
    <AuthUnavailableContent role="alert" aria-live="polite">
      <Typography variant="h5" component="h1">
        {t('title')}
      </Typography>
      <Typography color="text.secondary">{t('description')}</Typography>
      <Button variant="contained" disabled={retrying} onClick={retry}>
        {t(retrying ? 'retrying' : 'retry')}
      </Button>
    </AuthUnavailableContent>
  )
}
