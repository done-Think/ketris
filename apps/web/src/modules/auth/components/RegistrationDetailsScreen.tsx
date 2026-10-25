'use client'

import { styles } from '../styles/registration-details-screen.styles'

import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { Alert, Box, Button, Typography } from '@mui/material'

import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

import { EmailVerificationStep } from './EmailVerificationStep'
import { RegistrationDetailsForm } from './RegistrationDetailsForm'
import { authRoutes } from '../config/auth-routes'
import { useRegister } from '../hooks/use-register'
import type { RegistrationDetailsFormValues } from '../types/registration'
import type { RegistrationDetailsScreenProps } from '../types/registration'

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
        verification={pendingEmailVerification}
        onConfirmed={completeEmailVerification}
      />
    )
  }

  if (pendingApproval) {
    return (
      <Box sx={styles.box}>
        <Box aria-hidden="true" sx={styles.box2}>
          <CheckRoundedIcon sx={styles.checkRoundedIcon} />
        </Box>

        <Typography variant="h5" sx={styles.typography}>
          {t('pendingApproval.title')}
        </Typography>
        <Typography color="text.secondary" sx={styles.typography2}>
          {t('pendingApproval.description')}
        </Typography>

        <Button component={Link} href={authRoutes.login} variant="contained" sx={styles.button}>
          {t('pendingApproval.backToLogin')}
        </Button>
      </Box>
    )
  }

  return (
    <>
      {error ? (
        <Alert severity="error" sx={styles.alert}>
          {error}
        </Alert>
      ) : null}
      <RegistrationDetailsForm profile={profile} onSubmit={handleSubmit} />
    </>
  )
}
