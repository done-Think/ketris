'use client'

import { useMutation } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import type { AppLocale } from '@/i18n/types/locale.types'
import type { ConfirmSignupVerificationResponseDTO } from '@shared/types/generated/auth/http'
import { getApiErrorCode } from '@shared/utils/error-message'
import { authService } from '../services/auth-service'
import type { EmailVerificationStepProps } from '../types/registration'

export function useSignupVerification({ verification, onConfirmed }: EmailVerificationStepProps) {
  const t = useTranslations('auth.registerDetails.emailVerification')
  const locale = useLocale() as AppLocale
  const identity = { email: verification.email, tenantId: verification.tenantId }
  const verify = useMutation({
    mutationFn: (code: string) => authService.confirmSignupCode({ ...identity, code }),
  })
  const complete = useMutation({
    mutationFn: (response: ConfirmSignupVerificationResponseDTO) => onConfirmed(response),
  })
  const resend = useMutation({
    mutationFn: () => authService.requestSignupCode({ ...identity, locale }),
  })
  async function confirm(code: string) {
    try {
      const response = await verify.mutateAsync(code)
      await complete.mutateAsync(response)
    } catch {
      /* Mutation state supplies the translated error. */
    }
  }
  const code = getApiErrorCode(verify.error ?? resend.error)
  const error = complete.isError
    ? t('errors.sessionFailed')
    : verify.isError || resend.isError
      ? t(
          `errors.${code === 'INVALID_EMAIL_VERIFICATION_CODE' ? 'codeIncorrect' : code === 'RATE_LIMIT_EXCEEDED' ? 'rateLimited' : 'generic'}`,
        )
      : null
  return {
    confirm,
    resend,
    error,
    confirmed: Boolean(verify.data),
    isPending: verify.isPending || complete.isPending || resend.isPending,
  }
}
