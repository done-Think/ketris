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
      const companyName = values.companyName?.trim()
      const company = companyName ? { companyName } : {}
      if (values.profile === 'broker')
        return registrationService.register({
          ...details,
          profile: values.profile,
          creci: values.creci,
          document: values.document,
          ...(values.agencyId ? { agencyId: values.agencyId } : {}),
          ...company,
        })
      if (values.profile === 'renter')
        return registrationService.register({
          ...details,
          profile: values.profile,
          cpf: values.cpf,
        })
      if (values.profile === 'owner')
        return registrationService.register({
          ...details,
          profile: values.profile,
          cpf: values.cpf,
        })
      return registrationService.register({
        ...details,
        profile: values.profile,
        cnpj: values.cnpj,
        ...(values.profile === 'agency' && values.creci.trim()
          ? { creci: values.creci.trim() }
          : {}),
        ...company,
      })
    },
  })
  const code = getApiErrorCode(mutation.error)
  const messages: Record<string, string> = {
    AGENCY_NOT_FOUND: t('errors.agencyNotFound'),
    EMAIL_ALREADY_IN_USE: t('errors.emailAlreadyInUse'),
    PHONE_ALREADY_IN_USE: t('errors.phoneAlreadyInUse'),
    CRECI_ALREADY_IN_USE: t('errors.creciAlreadyInUse'),
    CPF_ALREADY_IN_USE: t('errors.cpfAlreadyInUse'),
    CNPJ_ALREADY_IN_USE: t('errors.cnpjAlreadyInUse'),
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
