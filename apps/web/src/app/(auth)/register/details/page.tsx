import { redirect } from 'next/navigation'

import {
  authRoutes,
  isRegistrationProfileId,
  RegistrationDetailsForm,
  RegistrationFormShell,
} from '@modules/auth'

export const metadata = { title: 'Criar sua conta | Ketris' }

type RegisterDetailsPageProps = {
  searchParams: { profile?: string | string[] }
}

export default function RegisterDetailsPage({ searchParams }: RegisterDetailsPageProps) {
  const requestedProfile = Array.isArray(searchParams.profile)
    ? searchParams.profile[0]
    : searchParams.profile

  if (!isRegistrationProfileId(requestedProfile)) {
    redirect(authRoutes.register)
  }

  return (
    <RegistrationFormShell currentStep={2} totalSteps={3} title="Criar sua conta">
      <RegistrationDetailsForm profile={requestedProfile} />
    </RegistrationFormShell>
  )
}
