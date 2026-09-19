'use client'

import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined'
import { Box, Button, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useWatch } from 'react-hook-form'

import { brand, componentText, radius } from '@shared/theme/tokens'
import { RhfTextField } from '@shared/components/form'

import { AuthFormField } from './AuthFormField'
import { authPrimaryButtonSx, authTextFieldSx } from './auth-form.styles'
import { ResendCountdownButton } from './ResendCountdownButton'
import { VerificationCodeField } from './VerificationCodeField'
import type { PasswordResetFormProps } from '../types/password-recovery'

export function PasswordResetForm({
  control,
  isSubmitting,
  onSubmit,
  onResend,
}: PasswordResetFormProps) {
  const t = useTranslations('auth.passwordRecovery')
  const code = useWatch({ control, name: 'code' })
  const isCodeComplete = /^\d{6}$/.test(code ?? '')

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box
          aria-hidden="true"
          sx={{
            width: { xs: 36, md: 60 },
            height: { xs: 36, md: 60 },
            display: { xs: 'none', md: 'grid' },
            placeItems: 'center',
            borderRadius: `${radius.full}px`,
            bgcolor: brand.magenta[50],
          }}
        >
          <MarkEmailReadOutlinedIcon sx={{ color: 'primary.main', fontSize: { xs: 18, md: 28 } }} />
        </Box>
      </Box>

      <Box sx={{ mt: { xs: 2, md: 4 }, textAlign: 'center' }}>
        <Typography variant="h3" sx={componentText.authCompactTitle}>
          {t('code.title')}
        </Typography>
        <Typography
          color="text.secondary"
          variant="body2"
          sx={{ mt: 0.5, ...componentText.authCompactBody }}
        >
          {t('code.description')}
        </Typography>
      </Box>

      <Box component="form" noValidate onSubmit={onSubmit} sx={{ mt: { xs: 1.5, md: 2.5 } }}>
        <Stack spacing={1.5}>
          <VerificationCodeField control={control} name="code" label={t('code.label')} />

          <ResendCountdownButton onResend={onResend} />

          {isCodeComplete ? (
            <>
              <AuthFormField htmlFor="password-reset-password" label={t('newPassword.label')}>
                <RhfTextField
                  id="password-reset-password"
                  control={control}
                  name="password"
                  type="password"
                  placeholder={t('newPassword.placeholder')}
                  autoComplete="new-password"
                  fullWidth
                  sx={authTextFieldSx}
                />
              </AuthFormField>

              <AuthFormField
                htmlFor="password-reset-confirmation"
                label={t('newPasswordConfirmation.label')}
              >
                <RhfTextField
                  id="password-reset-confirmation"
                  control={control}
                  name="passwordConfirmation"
                  type="password"
                  placeholder={t('newPasswordConfirmation.placeholder')}
                  autoComplete="new-password"
                  fullWidth
                  sx={authTextFieldSx}
                />
              </AuthFormField>
            </>
          ) : null}

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={isSubmitting || !isCodeComplete}
            sx={{
              ...authPrimaryButtonSx,
              height: { xs: 30, md: 46 },
              mt: 1,
              ...componentText.authCompactBody,
            }}
          >
            {t('resetSubmit')}
          </Button>
        </Stack>
      </Box>
    </Box>
  )
}
