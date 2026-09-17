'use client'

import { Link as MuiLink, Stack, Typography } from '@mui/material'
import { alpha as muiAlpha } from '@mui/material/styles'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { componentText, surface } from '@shared/theme/tokens'

import { authRoutes } from '../config/auth-routes'

export function LoginAccountPrompt() {
  const t = useTranslations('auth.login.prompt')

  return (
    <Stack direction="row" justifyContent="center" spacing={0.5} alignItems="center">
      <Typography
        variant="body2"
        sx={{
          color: { xs: muiAlpha(surface.lightText, 0.72), md: 'text.secondary' },
          ...componentText.authPrompt,
        }}
      >
        {t('question')}
      </Typography>
      <MuiLink
        component={Link}
        href={authRoutes.register}
        underline="hover"
        sx={{ color: 'primary.main', ...componentText.authPrompt, fontWeight: 700 }}
      >
        {t('createAccount')}
      </MuiLink>
    </Stack>
  )
}
