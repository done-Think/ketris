'use client'

import { useSession } from 'next-auth/react'
import { useInertContent } from '@shared/hooks/use-inert-content'

import type { AuthAvailabilityBoundaryProps } from '@shared/types/auth-availability'
import { AuthenticationUnavailable } from './AuthenticationUnavailable'
import { AuthAvailabilityContent, AuthUnavailableDialog } from './auth-availability.styles'

export function AuthAvailabilityBoundary({ children }: AuthAvailabilityBoundaryProps) {
  const { data: session } = useSession()
  const unavailable = session?.authUnavailable === true
  const inertRef = useInertContent(unavailable)

  return (
    <>
      <AuthAvailabilityContent aria-hidden={unavailable || undefined} ref={inertRef}>
        {children}
      </AuthAvailabilityContent>
      <AuthUnavailableDialog open={unavailable} disableEscapeKeyDown>
        <AuthenticationUnavailable />
      </AuthUnavailableDialog>
    </>
  )
}
