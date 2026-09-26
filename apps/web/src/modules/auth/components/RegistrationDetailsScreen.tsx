'use client'

import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { Alert, Box, Button, Typography } from '@mui/material'
import { alpha as muiAlpha } from '@mui/material/styles'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { brand, radius } from '@shared/theme/tokens'

import { authPrimaryButtonSx } from './auth-form.styles'
import { EmailVerificationStep } from './EmailVerificationStep'
import { RegistrationDetailsForm } from './RegistrationDetailsForm'
import { authRoutes } from '../config/auth-routes'
import { useRegister } from '../hooks/use-register'
import type { RegistrationDetailsFormValues } from '../schemas/registration-details-schema'
import type { RegistrationProfileId } from '../types/registration'

export interface RegistrationDetailsScreenProps {
  profile: RegistrationProfileId
}

export function RegistrationDetailsScreen({ profile }: RegistrationDetailsScreenProps) {
  const t = useTranslations('auth.registerDetails')
  const { error, pendingApproval, pendingEmailVerification, register, completeEmailVerification } =
    useRegister()

  async function handleSubmit(values: RegistrationDetailsFormValues) {
    await register(values)
  }

  if (pendingEmailVerification) {
    return (
      <EmailVerificationStep
        email={pendingEmailVerification}
        onConfirmed={completeEmailVerification}
      />
    )
  }

  if (pendingApproval) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Box
          aria-hidden="true"
          sx={{
            width: 52,
            height: 52,
            mx: 'auto',
            display: 'grid',
            placeItems: 'center',
            borderRadius: `${radius.full}px`,
            bgcolor: muiAlpha(brand.semantic.success, 0.08),
          }}
        >
          <CheckRoundedIcon sx={{ color: brand.semantic.success, fontSize: 28 }} />
        </Box>

        <Typography variant="h5" sx={{ mt: 2, mb: 0.5 }}>
          {t('pendingApproval.title')}
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 420, mx: 'auto' }}>
          {t('pendingApproval.description')}
        </Typography>

        <Button
          component={Link}
          href={authRoutes.login}
          variant="contained"
          sx={{ ...authPrimaryButtonSx, mt: 3 }}
        >
          {t('pendingApproval.backToLogin')}
        </Button>
      </Box>
    )
  }

  return (
    <>
      {error ? (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      ) : null}
      <RegistrationDetailsForm profile={profile} onSubmit={handleSubmit} />
    </>
  )
}
