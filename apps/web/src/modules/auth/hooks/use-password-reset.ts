'use client'

import { useState } from 'react'
import axios from 'axios'
import { useTranslations } from 'next-intl'

import { passwordRecoveryService } from '../services/password-recovery-service'
import type { ResetPasswordInput } from '../types/password-recovery'

function messageForErrorCode(t: (key: string) => string, code: string | undefined): string {
  if (code === 'RATE_LIMIT_EXCEEDED') return t('errors.rateLimited')
  if (code === 'INVALID_RESET_CODE') return t('errors.codeIncorrect')
  if (code === 'INVALID_RESET_TOKEN') return t('errors.resetTokenExpired')

  return t('errors.generic')
}

export function usePasswordReset() {
  const t = useTranslations('auth.passwordRecovery')
  const [requestCodeError, setRequestCodeError] = useState<string | null>(null)
  const [verifyCodeError, setVerifyCodeError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function requestCode(email: string): Promise<boolean> {
    setRequestCodeError(null)

    try {
      await passwordRecoveryService.requestCode(email)
      return true
    } catch (requestError) {
      const code = axios.isAxiosError(requestError)
        ? requestError.response?.data?.error?.code
        : undefined
      setRequestCodeError(messageForErrorCode(t, code))
      return false
    }
  }

  async function verifyCode(email: string, code: string): Promise<string | null> {
    setVerifyCodeError(null)

    try {
      return await passwordRecoveryService.verifyCode(email, code)
    } catch (verifyError) {
      const errorCode = axios.isAxiosError(verifyError)
        ? verifyError.response?.data?.error?.code
        : undefined
      setVerifyCodeError(messageForErrorCode(t, errorCode))
      return null
    }
  }

  async function resetPassword(input: ResetPasswordInput): Promise<boolean> {
    setError(null)

    try {
      await passwordRecoveryService.resetPassword(input)
      return true
    } catch (resetError) {
      const code = axios.isAxiosError(resetError)
        ? resetError.response?.data?.error?.code
        : undefined
      setError(messageForErrorCode(t, code))
      return false
    }
  }

  return {
    requestCodeError,
    verifyCodeError,
    error,
    requestCode,
    verifyCode,
    resetPassword,
  }
}
