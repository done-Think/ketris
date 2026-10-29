'use client'

import { styles } from '../styles/password-recovery-form.styles'

import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { Box, Button, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { RhfTextField } from '@shared/components/form'
import { componentText } from '@shared/theme/tokens'

import { AuthFormField } from '@shared/components/form/AuthFormField'
import { authPrimaryButtonSx, authTextFieldSx } from '@shared/components/form/auth-form.styles'
import type { PasswordRecoveryFormProps } from '../types/password-recovery'

export function PasswordRecoveryForm({
  control,
  isSubmitting,
  onSubmit,
}: PasswordRecoveryFormProps) {
  const t = useTranslations('auth.passwordRecovery')

  return (
    <Box>
      <Box sx={styles.box}>
        <Box aria-hidden="true" sx={styles.box2}>
          <LockOutlinedIcon sx={styles.lockOutlinedIcon} />
        </Box>
      </Box>

      <Box sx={styles.box3}>
        <Typography variant="h3" sx={componentText.authCompactTitle}>
          {t('title')}
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={styles.typography}>
          {t('subtitle')}
        </Typography>
      </Box>

      <Box component="form" noValidate onSubmit={onSubmit} sx={styles.box4}>
        <AuthFormField
          htmlFor="password-recovery-email"
          label={t('email.label')}
          labelSx={componentText.authCompactBody}
        >
          <RhfTextField
            id="password-recovery-email"
            control={control}
            name="email"
            placeholder={t('email.placeholder')}
            type="email"
            autoComplete="email"
            fullWidth
            sx={[authTextFieldSx, styles.emailField]}
          />
        </AuthFormField>

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={isSubmitting}
          sx={[authPrimaryButtonSx, styles.submitButton]}
        >
          {t('submit')}
        </Button>
      </Box>
    </Box>
  )
}
