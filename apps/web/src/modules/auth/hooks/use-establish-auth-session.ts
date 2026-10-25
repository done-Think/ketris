'use client'

import { useMutation } from '@tanstack/react-query'
import { signIn } from 'next-auth/react'

import { useRouter } from '@/i18n/navigation'
import type { ConfirmSignupVerificationResponseDTO } from '@server/auth/types/http'
import { getRestrictedRoleAccess } from '@shared/lib/auth/restricted-role-access'
import { getAuthDestination } from '../utils/auth-destination'

export function useEstablishAuthSession(callbackUrl = '/dashboard') {
  const router = useRouter()
  return useMutation({
    mutationFn: async (response: ConfirmSignupVerificationResponseDTO) => {
      if (response.outcome === 'PENDING_APPROVAL') return response
      const result = await signIn('token-session', {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        redirect: false,
      })
      if (!result || result.error) throw new Error('SESSION_CREATION_FAILED')
      const destination = getRestrictedRoleAccess(response.user.role)?.home ?? callbackUrl
      router.replace(getAuthDestination(destination, window.location.origin))
      router.refresh()
      return response
    },
  })
}
