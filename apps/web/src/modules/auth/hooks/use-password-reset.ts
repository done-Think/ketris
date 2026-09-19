'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface ResetPasswordErrorBody {
  error?: { code?: string }
}

export interface ResetPasswordInput {
  email: string
  code: string
  password: string
}

export function usePasswordReset() {
  const t = useTranslations('auth.passwordRecovery')
  const [error, setError] = useState<string | null>(null)

  function messageForErrorCode(code: string | undefined) {
    if (code === 'RATE_LIMIT_EXCEEDED') return t('errors.rateLimited')

    return t('errors.generic')
  }

  const resetPassword = async (input: ResetPasswordInput) => {
    setError(null)

    let response: Response

    try {
      response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
    } catch {
      setError(t('errors.generic'))
      return false
    }

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as ResetPasswordErrorBody | null
      setError(messageForErrorCode(body?.error?.code))
      return false
    }

    return true
  }

  return {
    error,
    resetPassword,
  }
}
