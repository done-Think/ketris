'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Stack, Typography } from '@mui/material'
import { getSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

import { RhfTextField } from '@shared/components/form'
import { ActionTextLink } from '@shared/components/ui'

import {
  platformSignInSchema,
  type PlatformSignInFormValues,
} from '../schemas/platform-sign-in-schema'

const GENERIC_ERROR = 'Não foi possível entrar. Confira o e-mail e a senha.'
const FORBIDDEN_ERROR = 'Acesso restrito a administradores da plataforma.'

export function PlatformSignInForm() {
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
      setFormError(GENERIC_ERROR)
      return
    }

    const session = await getSession()

    if (session?.scope !== 'platform') {
      await signOut({ redirect: false })
      setFormError(FORBIDDEN_ERROR)
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
        label="E-mail"
        type="email"
        autoComplete="username"
        fullWidth
        autoFocus
      />
      <RhfTextField
        control={control}
        name="password"
        label="Senha"
        type="password"
        autoComplete="current-password"
        fullWidth
      />

      {formError ? <Alert severity="error">{formError}</Alert> : null}

      <Button type="submit" variant="contained" size="large" disabled={isSubmitting} fullWidth>
        Entrar
      </Button>

      <Typography variant="body2" color="text.secondary" textAlign="center">
        Acesso restrito à administração geral do Ketris.
      </Typography>

      <Stack direction="row" justifyContent="center">
        <Typography variant="body2" color="text.secondary">
          <ActionTextLink href="/platform/setup">
            Ainda não há administrador da plataforma?
          </ActionTextLink>
        </Typography>
      </Stack>
    </Stack>
  )
}
