'use client'

import { styles } from '../styles/login-account-prompt.styles'

import { Link as MuiLink, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

import { authRoutes } from '../config/auth-routes'

export function LoginAccountPrompt() {
  const t = useTranslations('auth.login.prompt')

  return (
    <Stack direction="row" justifyContent="center" spacing={0.5} alignItems="center">
      <Typography variant="body2" sx={styles.typography}>
        {t('question')}
      </Typography>
      <MuiLink component={Link} href={authRoutes.register} underline="hover" sx={styles.muiLink}>
        {t('createAccount')}
      </MuiLink>
    </Stack>
  )
}
