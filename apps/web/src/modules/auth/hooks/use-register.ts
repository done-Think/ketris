'use client'

import { useMutation } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'

import type { AppLocale } from '@/i18n/types/locale.types'
import { getApiErrorCode } from '@shared/utils/error-message'
import { registrationService } from '../services/registration-service'
import type { RegistrationDetailsFormValues } from '../types/registration'
import { useEstablishAuthSession } from './use-establish-auth-session'

export function useRegister() {
  const t = useTranslations('auth.registerDetails')
  const locale = useLocale() as AppLocale
  const completion = useEstablishAuthSession()
  const mutation = useMutation({
    mutationFn: (values: RegistrationDetailsFormValues) => {
      if (!values.acceptTerms) throw new Error('TERMS_ACCEPTANCE_REQUIRED')
      const details = {
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        phone: values.phone,
        acceptTerms: values.acceptTerms,
        locale,
      }
      return registrationService.register(
        values.profile === 'broker'
          ? {
              ...details,
              profile: values.profile,
              creci: values.creci,
              ...(values.agencyId ? { agencyId: values.agencyId } : {}),
              ...(values.companyName?.trim() ? { companyName: values.companyName.trim() } : {}),
            }
          : values.profile === 'renter'
            ? { ...details, profile: values.profile }
            : {
                ...details,
                profile: values.profile,
                ...(values.creci.trim() ? { creci: values.creci.trim() } : {}),
                ...(values.companyName?.trim() ? { companyName: values.companyName.trim() } : {}),
              },
      )
    },
  })
  const code = getApiErrorCode(mutation.error)
  const messages: Record<string, string> = {
    AGENCY_NOT_FOUND: t('errors.agencyNotFound'),
    EMAIL_ALREADY_IN_USE: t('errors.emailAlreadyInUse'),
    RATE_LIMIT_EXCEEDED: t('errors.rateLimited'),
    PASSWORD_TOO_LONG: t('errors.passwordTooLong'),
  }
  async function register(values: RegistrationDetailsFormValues): Promise<boolean> {
    try {
      await mutation.mutateAsync(values)
      return true
    } catch {
      return false
    }
  }
  const pendingApproval = completion.data?.outcome === 'PENDING_APPROVAL'
  return {
    error: mutation.isError ? (code && messages[code]) || t('errors.generic') : null,
    pendingApproval,
    pendingEmailVerification: pendingApproval ? null : (mutation.data ?? null),
    isPending: mutation.isPending,
    register,
    completeEmailVerification: completion.mutateAsync,
  }
}
