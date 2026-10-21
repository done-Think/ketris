'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  Typography,
} from '@mui/material'
import { getSession, signIn, signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { useRouter } from '@/i18n/navigation'
import {
  AuthFormField,
  authLoginTextFieldSx,
  authPrimaryButtonSx,
  authTextFieldSx,
} from '@modules/auth'
import { RhfTextField } from '@shared/components/form'
import { brand, componentText } from '@shared/theme/tokens'

import {
  createPlatformSignInSchema,
  type PlatformSignInFormValues,
} from '../schemas/platform-sign-in-schema'

export function PlatformSignInForm() {
  const t = useTranslations('platform.login')
  const formsT = useTranslations('platform.forms')
  const loginT = useTranslations('auth.login')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)
  const hasAttemptedLocalAutoLogin = useRef(false)
  const platformSignInSchema = useMemo(
    () => createPlatformSignInSchema((key) => t(`errors.${key}`)),
    [t],
  )

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<PlatformSignInFormValues>({
    resolver: zodResolver(platformSignInSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: PlatformSignInFormValues) {
    setFormError(null)

    const result = await signIn('platform-credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    })

    if (!result || result.error) {
      setFormError(t('genericError'))
      return
    }

    const session = await getSession()

    if (session?.scope !== 'platform') {
      await signOut({ redirect: false })
      setFormError(t('forbiddenError'))
      return
    }

    router.push('/platform')
    router.refresh()
  }

  useEffect(() => {
    const email = process.env.NEXT_PUBLIC_LOCAL_PLATFORM_EMAIL
    const password = process.env.NEXT_PUBLIC_LOCAL_PLATFORM_PASSWORD
    const isLocalDevelopment =
      process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost'

    if (!isLocalDevelopment || !email || !password || hasAttemptedLocalAutoLogin.current) return

    hasAttemptedLocalAutoLogin.current = true
    void onSubmit({ email, password })
  }, [onSubmit])

  return (
    <Box>
      <Box sx={{ mb: { xs: 2, md: 3.25 }, textAlign: { xs: 'center', md: 'left' } }}>
        <Typography variant="h3" component="h1" sx={{ mb: 0.5, ...componentText.authTitle }}>
          {t('title')}
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={componentText.authBody}>
          {t('subtitle')}
        </Typography>
      </Box>

      <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={{ xs: 1.5, md: 1.75 }}>
          <AuthFormField
            htmlFor="platform-login-email"
            label={formsT('email')}
            labelSx={componentText.authBody}
          >
            <RhfTextField
              id="platform-login-email"
              control={control}
              name="email"
              placeholder={loginT('email.placeholder')}
              type="email"
              autoComplete="username"
              autoFocus
              fullWidth
              sx={[authTextFieldSx, authLoginTextFieldSx]}
            />
          </AuthFormField>

          <AuthFormField
            htmlFor="platform-login-password"
            label={formsT('password')}
            labelSx={componentText.authBody}
          >
            <RhfTextField
              id="platform-login-password"
              control={control}
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              fullWidth
              sx={[authTextFieldSx, authLoginTextFieldSx]}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          showPassword ? loginT('password.hide') : loginT('password.show')
                        }
                        edge="end"
                        size="small"
                        onClick={() => setShowPassword((current) => !current)}
                        sx={{ color: brand.neutral[500] }}
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

          {formError ? (
            <Alert severity="error" role="alert" sx={{ mt: 0.75 }}>
              {formError}
            </Alert>
          ) : null}
        </Stack>

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={isSubmitting}
          sx={[
            authPrimaryButtonSx,
            { mt: { xs: 2, md: 3.5 }, height: { xs: 36, md: 50 }, ...componentText.authBody },
          ]}
        >
          {isSubmitting ? <CircularProgress color="inherit" size={21} /> : t('submit')}
        </Button>
      </Box>

      <Typography
        variant="body2"
        color="text.secondary"
        textAlign="center"
        sx={{ mt: { xs: 2.5, md: 3 }, ...componentText.authBody }}
      >
        {t('restrictedAccess')}
      </Typography>
    </Box>
  )
}
