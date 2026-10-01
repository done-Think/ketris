'use client'

import { useEffect } from 'react'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { useRouter } from '@/i18n/navigation'
import { alpha, radius } from '@shared/theme/tokens'
import type { Papel } from '@server/auth/domain/user.entity'
import type { RoleGuardProps } from '@shared/types/role-guard'

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const t = useTranslations('common.roleGuard')
  const router = useRouter()
  const { data: session, status } = useSession()
  const isAllowed =
    status === 'authenticated' && !!session?.papel && allowedRoles.includes(session.papel as Papel)

  useEffect(() => {
    if (status === 'loading') return
    if (!isAllowed) router.replace('/dashboard')
  }, [status, isAllowed, router])

  if (status === 'loading') {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '55vh' }}>
        <CircularProgress size={30} aria-label={t('loadingSession')} />
      </Stack>
    )
  }

  if (!isAllowed) {
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
      </Stack>
    )
  }

  return <>{children}</>
}
