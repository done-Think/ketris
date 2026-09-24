'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

import { getLocalizedPathname } from '@/i18n/locale-prefix'
import type { LoginFormValues } from '../schemas/login-schema'

interface LoginErrorBody {
  error?: { code?: string }
}

export function useLogin(callbackUrl: string) {
  const t = useTranslations('auth.login')
  const locale = useLocale()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const localizedCallbackUrl = getLocalizedPathname(callbackUrl, locale)

  function messageForErrorCode(code: string | undefined) {
    if (code === 'ACCOUNT_DEACTIVATED') return t('accountDeactivated')
    if (code === 'RATE_LIMIT_EXCEEDED') return t('rateLimited')

    return t('genericError')
  }

  const login = async (values: LoginFormValues) => {
    setError(null)

    let loginResponse: Response

    try {
      loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
    } catch {
      setError(t('genericError'))
      return false
    }

    if (!loginResponse.ok) {
      const body = (await loginResponse.json().catch(() => null)) as LoginErrorBody | null
      setError(messageForErrorCode(body?.error?.code))
      return false
    }

    const { user, accessToken, refreshToken } = await loginResponse.json()

    try {
      const result = await signIn('token-session', {
        accessToken,
        refreshToken,
        callbackUrl: localizedCallbackUrl,
        redirect: false,
      })

      if (!result || result.error) {
        setError(t('genericError'))
        return false
      }

      const destination =
        user.role === 'RENTER' ? getLocalizedPathname('/', locale) : localizedCallbackUrl

      router.replace(destination)
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
