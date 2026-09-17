'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Stack, Typography } from '@mui/material'
import { getSession, signIn, signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { useRouter } from '@/i18n/navigation'
import { RhfTextField } from '@shared/components/form'
import { ActionTextLink } from '@shared/components/ui'

import { signInSchema, type SignInFormValues } from '../schemas/sign-in-schema'

export function SignInForm() {
  const t = useTranslations('auth.backoffice')
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: SignInFormValues) {
    setFormError(null)

    const result = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    })

    if (!result || result.error) {
      setFormError(t('signInGenericError'))
      return
    }

    const session = await getSession()

    if (session?.papel !== 'ADMIN') {
      await signOut({ redirect: false })
      setFormError(t('signInForbiddenError'))
      return
    }

    router.push('/backoffice')
    router.refresh()
  }

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={2.5}>
      <RhfTextField
        control={control}
        name="email"
        label={t('fields.email')}
        type="email"
        autoComplete="username"
        fullWidth
        autoFocus
      />
      <RhfTextField
        control={control}
        name="password"
        label={t('fields.password')}
        type="password"
        autoComplete="current-password"
        fullWidth
      />

      {formError ? <Alert severity="error">{formError}</Alert> : null}

      <Button type="submit" variant="contained" size="large" disabled={isSubmitting} fullWidth>
        {t('signInSubmit')}
      </Button>

      <Typography variant="body2" color="text.secondary" textAlign="center">
        {t('restrictedArea')}
      </Typography>

      <Stack direction="row" justifyContent="center">
        <Typography variant="body2" color="text.secondary">
          {t('alreadyAdmin')}{' '}
          <ActionTextLink href="/backoffice/admins/new">{t('registerNewAdmin')}</ActionTextLink>
        </Typography>
      </Stack>
    </Stack>
  )
}
