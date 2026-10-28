'use client'

import { styles } from '@shared/styles/tenant-session-boundary.styles'

import { useEffect } from 'react'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useInertContent } from '@shared/hooks/use-inert-content'
import { useTranslations } from 'next-intl'

import { Link, useRouter } from '@/i18n/navigation'
import { clearClientSession } from '@shared/lib/auth/clear-client-session'

import type { TenantSessionBoundaryProps } from '@shared/types/tenant-session-boundary'
import { useRetainedAuthContent } from '@shared/hooks/use-retained-auth-content'
import { AuthenticationUnavailable } from './AuthenticationUnavailable'
import { AuthAvailabilityContent } from './auth-availability.styles'

export function TenantSessionBoundary({ children }: TenantSessionBoundaryProps) {
  const t = useTranslations('common.tenantSessionBoundary')
  const router = useRouter()
  const { data: session, status } = useSession()
  const unavailable = session?.authUnavailable === true
  const inertRef = useInertContent(unavailable)
  const isAuthenticated =
    !unavailable && status === 'authenticated' && session?.scope === 'tenant' && !!session.tenantId
  const isRenter = isAuthenticated && session?.role === 'RENTER'
  const isSessionInvalid = !isAuthenticated || isRenter
  const retainContent = useRetainedAuthContent(!isSessionInvalid, unavailable, status === 'loading')

  useEffect(() => {
    if (status === 'loading' || unavailable) return

    if (isRenter) {
      router.replace('/')
      router.refresh()
      return
    }

    if (!isSessionInvalid) return

    clearClientSession().finally(() => {
      router.replace('/login')
      router.refresh()
    })
  }, [status, isSessionInvalid, isRenter, router, unavailable])

  if (retainContent) {
    return (
      <>
        <AuthAvailabilityContent aria-hidden={unavailable || undefined} ref={inertRef}>
          {children}
        </AuthAvailabilityContent>
        {unavailable && <AuthenticationUnavailable />}
      </>
    )
  }
  if (unavailable) return <AuthenticationUnavailable />

  if (status === 'loading') {
    return (
      <Stack alignItems="center" justifyContent="center" sx={styles.stack}>
        <CircularProgress size={30} aria-label={t('loadingSession')} />
      </Stack>
    )
  }

  if (isSessionInvalid) {
    return (
      <Stack alignItems="center" justifyContent="center" spacing={2} sx={styles.stack2}>
        <Box sx={styles.box}>
          <LockOutlinedIcon />
        </Box>
        <Box>
          <Typography variant="h5" sx={styles.typography}>
            {t('restrictedTitle')}
          </Typography>
          <Typography color="text.secondary" sx={styles.typography2}>
            {t('restrictedDescription')}
          </Typography>
        </Box>
        <Button component={Link} href="/login" variant="contained">
          {t('signIn')}
        </Button>
      </Stack>
    )
  }

  return <Box sx={styles.box2}>{children}</Box>
}
