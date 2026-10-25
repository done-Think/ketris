'use client'

import { getStyles } from '../styles/login-form.styles'

import { zodResolver } from '@hookform/resolvers/zod'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { Link } from '@/i18n/navigation'
import { RhfTextField } from '@shared/components/form'
import { componentText } from '@shared/theme/tokens'

import { authRoutes } from '../config/auth-routes'
import { useLogin } from '../hooks/use-login'
import { createLoginSchema, type LoginFormValues } from '../schemas/login-schema'
import {
  authLoginTextFieldSx,
  authPrimaryButtonSx,
  authTextFieldSx,
} from '@shared/components/form/auth-form.styles'
import { AuthFormField } from '@shared/components/form/AuthFormField'
import { LoginAccountPrompt } from './LoginAccountPrompt'
import { EmailVerificationStep } from './EmailVerificationStep'
import { LoginTenantSelect } from './LoginTenantSelect'

import type { LoginFormProps } from '../types/login'

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const t = useTranslations('auth.login')
  const registrationText = useTranslations('auth.registerDetails.pendingApproval')
  const [showPassword, setShowPassword] = useState(false)
  const {
    error,
    login,
    tenants = [],
    pendingEmailVerification,
    pendingApproval,
    completeEmailVerification,
    resetLogin,
  } = useLogin(callbackUrl)
  const styles = getStyles(Boolean(error))
  const loginSchema = useMemo(() => createLoginSchema((key) => t(`errors.${key}`)), [t])
  const {
    control,
    handleSubmit,
    resetField,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })
  const selectedTenantId = useWatch({ control, name: 'tenantId' })

  function clearTenantSelection(event: FormEvent<HTMLFormElement>) {
    const input = event.target
    if (!(input instanceof HTMLInputElement)) return
    if (input.name !== 'email' && input.name !== 'password') return
    if (tenants.length === 0 && !selectedTenantId) return

    resetField('tenantId', { defaultValue: '' })
    resetLogin()
  }

  if (pendingApproval) return <Alert severity="info">{registrationText('description')}</Alert>
  if (pendingEmailVerification)
    return (
      <EmailVerificationStep
        verification={pendingEmailVerification}
        onConfirmed={completeEmailVerification}
      />
    )

  return (
    <Box>
      <Box sx={styles.box}>
        <Typography variant="h3" sx={styles.typography}>
          {t('title')}
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={componentText.authBody}>
          {t('subtitle')}
        </Typography>
      </Box>

      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(login)}
        onChange={clearTenantSelection}
      >
        <Stack spacing={{ xs: 1.5, md: 1.75 }}>
          <AuthFormField
            htmlFor="login-email"
            label={t('email.label')}
            labelSx={componentText.authBody}
          >
            <RhfTextField
              id="login-email"
              control={control}
              name="email"
              placeholder={t('email.placeholder')}
              type="email"
              autoComplete="email"
              slotProps={{ htmlInput: { readOnly: isSubmitting } }}
              fullWidth
              sx={[authTextFieldSx, authLoginTextFieldSx]}
            />
          </AuthFormField>

          <Box>
            <AuthFormField
              htmlFor="login-password"
              label={t('password.label')}
              labelSx={componentText.authBody}
            >
              <RhfTextField
                id="login-password"
                control={control}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                fullWidth
                sx={[authTextFieldSx, authLoginTextFieldSx]}
                slotProps={{
                  htmlInput: { readOnly: isSubmitting },
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showPassword ? t('password.hide') : t('password.show')}
                          edge="end"
                          size="small"
                          onClick={() => setShowPassword((current) => !current)}
                          sx={styles.iconButton}
                        >
                          {showPassword ? (
                            <VisibilityOffOutlinedIcon fontSize="small" />
                          ) : (
                            <VisibilityOutlinedIcon fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </AuthFormField>

            <Box sx={styles.box2}>
              <Typography component={Link} href={authRoutes.forgotPassword} sx={styles.typography2}>
                {t('forgotPassword')}
              </Typography>
            </Box>
          </Box>

          <LoginTenantSelect control={control} tenants={tenants} />

          {error && (
            <Alert severity="error" role="alert" sx={styles.alert}>
              {error}
            </Alert>
          )}
        </Stack>

        <Stack spacing={{ xs: 1.25, md: 1.75 }} sx={styles.stack}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={isSubmitting || (tenants.length > 0 && !selectedTenantId)}
            sx={[authPrimaryButtonSx, styles.submitButton]}
          >
            {isSubmitting ? <CircularProgress color="inherit" size={21} /> : t('submit')}
          </Button>

          <Divider sx={styles.divider}>{t('separator')}</Divider>

          <Button
            type="button"
            variant="outlined"
            color="secondary"
            size="large"
            fullWidth
            disabled
            aria-label={t('google.ariaLabel')}
            startIcon={
              <Box aria-hidden="true" sx={styles.box3}>
                G
              </Box>
            }
            sx={styles.button}
          >
            {t('google.label')}
          </Button>
        </Stack>
      </Box>

      <Box sx={styles.box4}>
        <LoginAccountPrompt />
      </Box>
    </Box>
  )
}
