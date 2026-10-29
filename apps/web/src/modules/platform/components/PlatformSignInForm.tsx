'use client'

import { useCallback, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { getSession, signIn, signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { useRouter } from '@/i18n/navigation'
import {
  AuthFormField,
  authLoginTextFieldSx,
  authPrimaryButtonSx,
  authTextFieldSx,
  RhfPasswordField,
  RhfTextField,
} from '@shared/components/form'
import { componentText } from '@shared/theme/tokens'

import {
  createPlatformSignInSchema,
  type PlatformSignInFormValues,
} from '../schemas/platform-sign-in-schema'
import { styles } from '../styles/platform-sign-in-form.styles'

export function PlatformSignInForm() {
  const t = useTranslations('platform.login')
  const validation = useTranslations('validation')
  const formsT = useTranslations('platform.forms')
  const loginT = useTranslations('auth.login')
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)
  const platformSignInSchema = useMemo(() => createPlatformSignInSchema(validation), [validation])

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<PlatformSignInFormValues>({
    resolver: zodResolver(platformSignInSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = useCallback(
    async (values: PlatformSignInFormValues) => {
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
    },
    [router, t],
  )

  return (
    <Box>
      <Box sx={styles.box}>
        <Typography variant="h3" component="h1" sx={styles.typography}>
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
            <RhfPasswordField
              id="platform-login-password"
              control={control}
              name="password"
              autoComplete="current-password"
              fullWidth
              sx={[authTextFieldSx, authLoginTextFieldSx]}
            />
          </AuthFormField>

          {formError ? (
            <Alert severity="error" role="alert" sx={styles.alert}>
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

      <Typography variant="body2" color="text.secondary" textAlign="center" sx={styles.typography2}>
        {t('restrictedAccess')}
      </Typography>
    </Box>
  )
}
