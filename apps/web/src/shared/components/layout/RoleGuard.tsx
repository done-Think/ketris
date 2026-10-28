'use client'

import { styles } from '@shared/styles/role-guard.styles'

import { useEffect } from 'react'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useInertContent } from '@shared/hooks/use-inert-content'
import { useTranslations } from 'next-intl'

import { useRouter } from '@/i18n/navigation'

import type { RoleGuardProps } from '@shared/types/role-guard'
import { useRetainedAuthContent } from '@shared/hooks/use-retained-auth-content'
import { AuthenticationUnavailable } from './AuthenticationUnavailable'
import { AuthAvailabilityContent } from './auth-availability.styles'

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const t = useTranslations('common.roleGuard')
  const router = useRouter()
  const { data: session, status } = useSession()
  const unavailable = session?.authUnavailable === true
  const inertRef = useInertContent(unavailable)
  const isAllowed =
    !unavailable &&
    status === 'authenticated' &&
    !!session?.role &&
    allowedRoles.includes(session.role)
  const retainContent = useRetainedAuthContent(isAllowed, unavailable, status === 'loading')

  useEffect(() => {
    if (status === 'loading' || unavailable) return
    if (!isAllowed) router.replace('/dashboard')
  }, [status, isAllowed, router, unavailable])

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

  if (!isAllowed) {
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
      </Stack>
    )
  }

  return <>{children}</>
}
