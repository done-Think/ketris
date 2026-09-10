'use client'

import { useEffect } from 'react'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { Link, useRouter } from '@/i18n/navigation'
import { alpha, radius, surface } from '@shared/theme/tokens'

import type { CrmAccessBoundaryProps } from '../types/layout'

export function CrmAccessBoundary({ children }: CrmAccessBoundaryProps) {
  const t = useTranslations('crm.access')
  const router = useRouter()
  const { data: session, status } = useSession()
  const isSessionInvalid =
    status !== 'authenticated' || session?.scope !== 'tenant' || !session.tenantId

  // The server-side layout only redirects on the initial navigation — if the session becomes
  // invalid while the SPA is already open (token revalidated as stale, expiry, etc.), this is what
  // sends the user back to /login instead of leaving them stuck on an empty/restricted screen.
  useEffect(() => {
    if (status === 'loading') return
    if (isSessionInvalid) router.replace('/login')
  }, [status, isSessionInvalid, router])

  if (status === 'loading') {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '55vh' }}>
        <CircularProgress size={30} aria-label={t('loadingSession')} />
      </Stack>
    )
  }

  if (isSessionInvalid) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        spacing={2}
        sx={{ minHeight: '55vh', textAlign: 'center' }}
      >
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            width: 52,
            height: 52,
            borderRadius: `${radius.md}px`,
            bgcolor: alpha.magenta[10],
            color: 'primary.main',
          }}
        >
          <LockOutlinedIcon />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ mb: 0.5 }}>
            {t('restrictedTitle')}
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 430 }}>
            {t('restrictedDescription')}
          </Typography>
        </Box>
        <Button component={Link} href="/login" variant="contained">
          {t('signIn')}
        </Button>
      </Stack>
    )
  }

  return <Box sx={{ minHeight: '100%', bgcolor: surface.app }}>{children}</Box>
}
