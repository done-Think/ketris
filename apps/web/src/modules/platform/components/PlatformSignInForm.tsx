'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Stack, Typography } from '@mui/material'
import { getSession, signIn, signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { useRouter } from '@/i18n/navigation'
import { RhfTextField } from '@shared/components/form'

import {
  platformSignInSchema,
  type PlatformSignInFormValues,
} from '../schemas/platform-sign-in-schema'

export function PlatformSignInForm() {
  const t = useTranslations('platform.login')
  const formsT = useTranslations('platform.forms')
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)

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

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={2.5}>
      <RhfTextField
        control={control}
        name="email"
        label={formsT('email')}
        type="email"
        autoComplete="username"
        fullWidth
        autoFocus
      />
      <RhfTextField
        control={control}
        name="password"
        label={formsT('password')}
        type="password"
        autoComplete="current-password"
        fullWidth
      />

      {formError ? <Alert severity="error">{formError}</Alert> : null}

      <Button type="submit" variant="contained" size="large" disabled={isSubmitting} fullWidth>
        {t('submit')}
      </Button>

      <Typography variant="body2" color="text.secondary" textAlign="center">
        {t('restrictedAccess')}
      </Typography>
    </Stack>
  )
}
