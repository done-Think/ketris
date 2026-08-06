'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { RegistrationProfileStep } from './RegistrationProfileStep'
import { RegistrationShell } from './RegistrationShell'
import type { RegistrationProfileId } from '../config/registration-profiles'
import { getRegistrationDetailsRoute } from '../config/registration-routes'

const STEP_TRANSITION_DURATION_MS = 320

export function RegistrationProfileScreen() {
  const router = useRouter()
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isAdvancing, setIsAdvancing] = useState(false)

  useEffect(() => {
    return () => {
      if (navigationTimer.current) {
        clearTimeout(navigationTimer.current)
      }
    }
  }, [])

  function continueRegistration(profile: RegistrationProfileId) {
    if (isAdvancing) return

    setIsAdvancing(true)
    navigationTimer.current = setTimeout(() => {
      router.push(getRegistrationDetailsRoute(profile))
    }, STEP_TRANSITION_DURATION_MS)
  }

  return (
    <RegistrationShell currentStep={isAdvancing ? 2 : 1} totalSteps={3}>
      <RegistrationProfileStep isAdvancing={isAdvancing} onContinue={continueRegistration} />
    </RegistrationShell>
  )
}
