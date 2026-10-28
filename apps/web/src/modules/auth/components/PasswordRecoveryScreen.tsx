'use client'

import { useCallback, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Link as MuiLink } from '@mui/material'
import { useLocale, useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'

import { Link } from '@/i18n/navigation'
import { getApiErrorCode } from '@shared/utils/error-message'
import type { AppLocale } from '@/i18n/types/locale.types'

import { authRoutes } from '../config/auth-routes'
import { usePasswordReset } from '../hooks/use-password-reset'
import {
  createPasswordRecoverySchema,
  createPasswordResetSchema,
  createRecoveryTenantSchema,
} from '../schemas/password-recovery-schema'
import { styles } from '../styles/password-recovery-screen.styles'
import type {
  PasswordRecoveryFormValues,
  PasswordResetFormValues,
  RecoveryState,
  RecoveryTenantValues,
} from '../types/password-recovery'
import { AuthShell } from '@shared/components/layout/AuthShell'
import { NewPasswordStep } from './NewPasswordStep'
import { PasswordRecoveryConfirmation } from './PasswordRecoveryConfirmation'
import { PasswordRecoveryForm } from './PasswordRecoveryForm'
import { RecoveryTenantStep } from './RecoveryTenantStep'
import { VerificationCodeStep } from './VerificationCodeStep'

export function PasswordRecoveryScreen() {
  const t = useTranslations('auth.passwordRecovery')
  const validation = useTranslations('validation')
  const locale = useLocale() as AppLocale
  const [state, setState] = useState<RecoveryState>({
    step: 'request',
    email: '',
    resetToken: '',
    tenants: [],
  })
  const { requestCode, verifyCode, resetPassword, errorMessage } = usePasswordReset()
  const requestForm = useForm<PasswordRecoveryFormValues>({
    resolver: zodResolver(createPasswordRecoverySchema(validation)),
    defaultValues: { email: '' },
  })
  const resetForm = useForm<PasswordResetFormValues>({
    resolver: zodResolver(createPasswordResetSchema(validation)),
    defaultValues: { code: '', password: '', passwordConfirmation: '' },
  })
  const tenantForm = useForm<RecoveryTenantValues>({
    resolver: zodResolver(createRecoveryTenantSchema((key) => t(`errors.${key}`))),
    defaultValues: { tenantId: '' },
  })

  const requestRecovery = requestForm.handleSubmit(async ({ email }) => {
    requestForm.clearErrors('root')
    try {
      await requestCode.mutateAsync({ email, locale })
      setState({ step: 'code', email, resetToken: '', tenants: [] })
    } catch (error) {
      requestForm.setError('root', { message: errorMessage(error) })
    }
  })

  const { mutateAsync: verify } = verifyCode
  const verifyCurrentCode = useCallback(async () => {
    resetForm.clearErrors('root')
    const code = resetForm.getValues('code')
    try {
      const response = await verify({ email: state.email, code })
      if ('resetToken' in response) {
        setState((current) => ({
          ...current,
          step: 'newPassword',
          resetToken: response.resetToken,
        }))
      } else {
        setState((current) => ({ ...current, step: 'tenant', tenants: response.tenants }))
      }
    } catch (error) {
      resetForm.setError('root', { message: errorMessage(error) })
      resetForm.setValue('code', '')
      resetForm.setError('code', { type: 'server' })
    }
  }, [verify, state.email, resetForm, errorMessage])

  const selectTenant = tenantForm.handleSubmit(async ({ tenantId }) => {
    tenantForm.clearErrors('root')
    try {
      const response = await verify({
        email: state.email,
        code: resetForm.getValues('code'),
        tenantId,
      })
      if ('resetToken' in response) {
        setState((current) => ({
          ...current,
          step: 'newPassword',
          tenantId,
          resetToken: response.resetToken,
          tenants: [],
        }))
      }
    } catch (error) {
      tenantForm.setError('root', { message: errorMessage(error) })
    }
  })

  const submitReset = resetForm.handleSubmit(async ({ password }) => {
    resetForm.clearErrors('root')
    try {
      await resetPassword.mutateAsync({
        email: state.email,
        password,
        resetToken: state.resetToken,
        ...(state.tenantId ? { tenantId: state.tenantId } : {}),
      })
      resetForm.reset({ code: '', password: '', passwordConfirmation: '' })
      setState({ step: 'done', email: '', resetToken: '', tenants: [] })
    } catch (error) {
      resetForm.setError('root', { message: errorMessage(error) })
    }
  })

  async function restartRecovery() {
    resetForm.clearErrors('root')
    try {
      await requestCode.mutateAsync({ email: state.email, locale })
      resetPassword.reset()
      resetForm.reset({ code: '', password: '', passwordConfirmation: '' })
      tenantForm.reset({ tenantId: '' })
      setState((current) => ({
        ...current,
        step: 'code',
        resetToken: '',
        tenantId: undefined,
        tenants: [],
      }))
    } catch (error) {
      resetForm.setError('root', { message: errorMessage(error) })
    }
  }

  async function resendCode() {
    resetForm.clearErrors('root')
    try {
      await requestCode.mutateAsync({ email: state.email, locale })
      resetForm.setValue('code', '')
    } catch (error) {
      resetForm.setError('root', { message: errorMessage(error) })
    }
  }

  return (
    <AuthShell
      brandDescription={
        state.step === 'request' ? t('brandDescription') : t('successBrandDescription')
      }
      contentMaxWidth={560}
      mobileVariant="backdrop"
      footer={
        state.step === 'done' ? undefined : (
          <MuiLink component={Link} href={authRoutes.login} underline="hover" sx={styles.muiLink}>
            {t('backToLogin')}
          </MuiLink>
        )
      }
    >
      {state.step === 'request' ? (
        <>
          {requestForm.formState.errors.root?.message ? (
            <Alert severity="error" sx={styles.alert}>
              {requestForm.formState.errors.root.message}
            </Alert>
          ) : null}
          <PasswordRecoveryForm
            control={requestForm.control}
            isSubmitting={requestCode.isPending}
            onSubmit={requestRecovery}
          />
        </>
      ) : state.step === 'code' ? (
        <VerificationCodeStep
          control={resetForm.control}
          isVerifying={verifyCode.isPending || requestCode.isPending}
          error={resetForm.formState.errors.root?.message ?? null}
          onCodeComplete={verifyCurrentCode}
          onResend={resendCode}
        />
      ) : state.step === 'tenant' ? (
        <RecoveryTenantStep
          control={tenantForm.control}
          tenants={state.tenants}
          isSubmitting={verifyCode.isPending}
          onSubmit={selectTenant}
          error={tenantForm.formState.errors.root?.message}
          onBack={() => {
            resetForm.setValue('code', '')
            setState((current) => ({ ...current, step: 'code', tenants: [] }))
          }}
        />
      ) : state.step === 'newPassword' ? (
        <>
          {resetForm.formState.errors.root?.message ? (
            <Alert severity="error" sx={styles.alert2}>
              {resetForm.formState.errors.root.message}
            </Alert>
          ) : null}
          <NewPasswordStep
            control={resetForm.control}
            isSubmitting={resetPassword.isPending || requestCode.isPending}
            onSubmit={submitReset}
          />
          {getApiErrorCode(resetPassword.error) === 'INVALID_RESET_TOKEN' ? (
            <Button type="button" onClick={restartRecovery} disabled={requestCode.isPending}>
              {t('resend')}
            </Button>
          ) : null}
        </>
      ) : (
        <PasswordRecoveryConfirmation />
      )}
    </AuthShell>
  )
}
