'use client'

import { useMutation } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'

import type { AppLocale } from '@/i18n/types/locale.types'
import { getApiErrorCode } from '@shared/utils/error-message'

import { authService } from '../services/auth-service'
import type { LoginFormValues } from '../types/login'
import { useEstablishAuthSession } from './use-establish-auth-session'

export function useLogin(callbackUrl: string) {
  const t = useTranslations('auth.login')
  const locale = useLocale() as AppLocale
  const completion = useEstablishAuthSession(callbackUrl)
  const mutation = useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: async (values: LoginFormValues) => {
      const response = await authService.login({ ...values, locale })
      if ('outcome' in response) return response
      await completion.mutateAsync({ ...response, outcome: 'REGISTERED' })
      return response
    },
  })

  async function login(values: LoginFormValues): Promise<boolean> {
    try {
      const response = await mutation.mutateAsync(values)
      return !('outcome' in response)
    } catch {
      return false
    }
  }

  const code = getApiErrorCode(mutation.error)
  const errorMessages: Record<string, string> = {
    ACCOUNT_DEACTIVATED: t('accountDeactivated'),
    RATE_LIMIT_EXCEEDED: t('rateLimited'),
    TENANT_ACCESS_BLOCKED: t('tenantBlocked'),
    MEMBERSHIP_PENDING_APPROVAL: t('membershipPending'),
    EMAIL_NOT_VERIFIED: t('emailNotVerified'),
  }

  return {
    error: mutation.isError ? (code && errorMessages[code]) || t('genericError') : null,
    tenants:
      mutation.data && 'outcome' in mutation.data && mutation.data.outcome === 'SELECT_TENANT'
        ? mutation.data.tenants
        : [],
    pendingEmailVerification:
      mutation.data &&
      'outcome' in mutation.data &&
      mutation.data.outcome === 'PENDING_EMAIL_VERIFICATION'
        ? mutation.data
        : null,
    pendingApproval: completion.data?.outcome === 'PENDING_APPROVAL',
    completeEmailVerification: completion.mutateAsync,
    resetLogin: mutation.reset,
    isPending: mutation.isPending,
    login,
  }
}
