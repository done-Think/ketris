'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

import type { LoginFormValues } from '../schemas/login-schema'

const LOGIN_ERROR_MESSAGE = 'Não foi possível entrar. Verifique seus dados e tente novamente.'

export function useLogin(callbackUrl: string) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const login = async (values: LoginFormValues) => {
    setError(null)

    try {
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        callbackUrl,
        redirect: false,
      })

      if (!result || result.error) {
        setError(LOGIN_ERROR_MESSAGE)
        return false
      }

      router.replace(callbackUrl)
      router.refresh()
      return true
    } catch {
      setError(LOGIN_ERROR_MESSAGE)
      return false
    }
  }

  return {
    error,
    login,
  }
}
