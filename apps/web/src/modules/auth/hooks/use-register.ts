'use client'

import { useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

import { getLocalizedPathname } from '@/i18n/locale-prefix'
import type { RegistrationDetailsFormValues } from '../schemas/registration-details-schema'

interface RegisterErrorBody {
  error?: { code?: string }
}

interface RegisteredBody {
  outcome: 'REGISTERED'
  user: { role: string }
  accessToken: string
  refreshToken: string
}

interface PendingApprovalBody {
  outcome: 'PENDING_APPROVAL'
  email: string
}

type RegisterResponseBody = RegisteredBody | PendingApprovalBody

export function useRegister() {
  const t = useTranslations('auth.registerDetails')
  const locale = useLocale()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pendingApproval, setPendingApproval] = useState(false)
  const [pendingEmailVerification, setPendingEmailVerification] = useState<string | null>(null)
  const pendingRedirect = useRef<string | null>(null)

  function messageForErrorCode(code: string | undefined) {
    if (code === 'AGENCY_NOT_FOUND') return t('errors.agencyNotFound')
    if (code === 'EMAIL_ALREADY_IN_USE') return t('errors.emailAlreadyInUse')
    if (code === 'RATE_LIMIT_EXCEEDED') return t('errors.rateLimited')

    return t('errors.generic')
  }

  const register = async (values: RegistrationDetailsFormValues): Promise<boolean> => {
    setError(null)
    setPendingApproval(false)
    setPendingEmailVerification(null)

    let response: Response

    try {
      response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
    } catch {
      setError(t('errors.generic'))
      return false
    }

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as RegisterErrorBody | null
      setError(messageForErrorCode(body?.error?.code))
      return false
    }

    const body = (await response.json()) as RegisterResponseBody

    if (body.outcome === 'PENDING_APPROVAL') {
      setPendingApproval(true)
      return true
    }

    try {
      const result = await signIn('token-session', {
        accessToken: body.accessToken,
        refreshToken: body.refreshToken,
        redirect: false,
      })

      if (!result || result.error) {
        setError(t('errors.generic'))
        return false
      }

      const destination = body.user.role === 'RENTER' ? '/' : '/dashboard'
      pendingRedirect.current = getLocalizedPathname(destination, locale)
      setPendingEmailVerification(values.email)
      return true
    } catch {
      setError(t('errors.generic'))
      return false
    }
  }

  function completeEmailVerification() {
    setPendingEmailVerification(null)

    if (pendingRedirect.current) {
      router.replace(pendingRedirect.current)
      router.refresh()
    }
  }

  return { error, pendingApproval, pendingEmailVerification, register, completeEmailVerification }
}
