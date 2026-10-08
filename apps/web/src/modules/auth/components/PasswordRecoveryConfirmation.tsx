'use client'

import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { Box, Button, Typography } from '@mui/material'
import { alpha as muiAlpha } from '@mui/material/styles'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { brand, componentText, radius } from '@shared/theme/tokens'

import { authPrimaryButtonSx } from './auth-form.styles'
import { authRoutes } from '../config/auth-routes'

export function PasswordRecoveryConfirmation() {
  const t = useTranslations('auth.passwordRecovery')

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box
        aria-hidden="true"
        sx={{
          width: { xs: 36, md: 60 },
          height: { xs: 36, md: 60 },
          mx: 'auto',
          display: 'grid',
          placeItems: 'center',
          borderRadius: `${radius.full}px`,
          bgcolor: muiAlpha(brand.semantic.success, 0.08),
        }}
      >
        <CheckRoundedIcon sx={{ color: brand.semantic.success, fontSize: { xs: 18, md: 28 } }} />
      </Box>

      <Box sx={{ mt: { xs: 2, md: 4 } }}>
        <Typography variant="h3" sx={componentText.authCompactTitle}>
          {t('resetSuccess.title')}
        </Typography>
        <Typography
          color="text.secondary"
          variant="body2"
          sx={{ mt: 0.5, ...componentText.authCompactBody }}
        >
          {t('resetSuccess.description')}
        </Typography>
      </Box>

      <Button
        component={Link}
        href={authRoutes.login}
        variant="contained"
        size="large"
        fullWidth
        sx={{
          ...authPrimaryButtonSx,
          height: { xs: 30, md: 46 },
          mt: { xs: 2, md: 3.25 },
          ...componentText.authCompactBody,
        }}
      >
        {t('backToLogin')}
      </Button>
    </Box>
  )
}
