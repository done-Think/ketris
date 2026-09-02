'use client'

import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { Box, Button, Stack, Typography } from '@mui/material'
import { alpha as muiAlpha } from '@mui/material/styles'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { brand, componentText, radius } from '@shared/theme/tokens'

import { authPrimaryButtonSx } from './auth-form.styles'
import { ResendCountdownButton } from './ResendCountdownButton'
import { authRoutes } from '../config/auth-routes'
import type { PasswordRecoveryConfirmationProps } from '../types/password-recovery'

export function PasswordRecoveryConfirmation({ onResend }: PasswordRecoveryConfirmationProps) {
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
          {t('confirmation.title')}
        </Typography>
        <Typography
          color="text.secondary"
          variant="body2"
          sx={{ display: { xs: 'none', md: 'block' }, mt: 0.5 }}
        >
          {t('confirmation.description')}
        </Typography>
        <Typography
          color="text.secondary"
          variant="body2"
          sx={{ display: { xs: 'block', md: 'none' }, mt: 0.5, fontSize: 10 }}
        >
          {t('confirmation.mobileDescription')}
        </Typography>
      </Box>

      <Stack direction="row" spacing={1.5} sx={{ mt: { xs: 2, md: 3.25 } }}>
        <ResendCountdownButton onResend={onResend} />

        <Button
          component={Link}
          href={authRoutes.login}
          variant="contained"
          size="large"
          fullWidth
          sx={[
            authPrimaryButtonSx,
            {
              height: { xs: 30, md: 46 },
              ...componentText.authCompactBody,
            },
          ]}
        >
          {t('backToLogin')}
        </Button>
      </Stack>
    </Box>
  )
}
