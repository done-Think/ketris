'use client'

import { useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'

import { getApiErrorCode } from '@shared/utils/error-message'

import { passwordRecoveryService } from '../services/password-recovery-service'
import type {
  RequestRecoveryInput,
  ResetPasswordInput,
  VerifyRecoveryInput,
} from '../types/password-recovery'

export function usePasswordReset() {
  const t = useTranslations('auth.passwordRecovery')
  const requestCode = useMutation({
    mutationFn: ({ email, locale }: RequestRecoveryInput) =>
      passwordRecoveryService.requestCode(email, locale),
  })
  const verifyCode = useMutation({
    mutationFn: ({ email, code, tenantId }: VerifyRecoveryInput) =>
      passwordRecoveryService.verifyCode(email, code, tenantId),
  })
  const resetPassword = useMutation({
    mutationFn: (input: ResetPasswordInput) => passwordRecoveryService.resetPassword(input),
  })

  const errorMessage = useCallback(
    (error: unknown) => {
      const code = getApiErrorCode(error)
      const key =
        code === 'RATE_LIMIT_EXCEEDED'
          ? 'rateLimited'
          : code === 'INVALID_RESET_CODE'
            ? 'codeIncorrect'
            : code === 'INVALID_RESET_TOKEN'
              ? 'resetTokenExpired'
              : 'generic'
      return t(`errors.${key}`)
    },
    [t],
  )

  return { requestCode, verifyCode, resetPassword, errorMessage }
}
