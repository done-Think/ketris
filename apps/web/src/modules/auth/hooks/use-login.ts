'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

import { getLocalizedPathname } from '@/i18n/locale-prefix'
import type { LoginFormValues } from '../schemas/login-schema'

export function useLogin(callbackUrl: string) {
  const t = useTranslations('auth.login')
  const locale = useLocale()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const localizedCallbackUrl = getLocalizedPathname(callbackUrl, locale)

  const login = async (values: LoginFormValues) => {
    setError(null)

    try {
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        callbackUrl: localizedCallbackUrl,
        redirect: false,
      })

      if (!result || result.error) {
        setError(t('genericError'))
        return false
      }

      router.replace(localizedCallbackUrl)
      router.refresh()
      return true
    } catch {
      setError(t('genericError'))
      return false
    }
  }

  return {
    error,
    login,
  }
}
