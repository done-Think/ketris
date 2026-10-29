'use client'

import { styles } from '../styles/password-recovery-confirmation.styles'

import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { Box, Button, Typography } from '@mui/material'

import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { componentText } from '@shared/theme/tokens'

import { authRoutes } from '../config/auth-routes'

export function PasswordRecoveryConfirmation() {
  const t = useTranslations('auth.passwordRecovery')

  return (
    <Box sx={styles.box}>
      <Box aria-hidden="true" sx={styles.box2}>
        <CheckRoundedIcon sx={styles.checkRoundedIcon} />
      </Box>

      <Box sx={styles.box3}>
        <Typography variant="h3" sx={componentText.authCompactTitle}>
          {t('resetSuccess.title')}
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={styles.typography}>
          {t('resetSuccess.description')}
        </Typography>
      </Box>

      <Button
        component={Link}
        href={authRoutes.login}
        variant="contained"
        size="large"
        fullWidth
        sx={styles.button}
      >
        {t('backToLogin')}
      </Button>
    </Box>
  )
}
