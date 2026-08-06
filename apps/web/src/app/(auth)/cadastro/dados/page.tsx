import { redirect } from 'next/navigation'

import {
  isRegistrationProfileId,
  RegistrationDetailsForm,
  RegistrationFormShell,
  registrationRoutes,
} from '@modules/auth'

export const metadata = { title: 'Criar sua conta | Ketris' }

type CadastroDadosPageProps = {
  searchParams: { perfil?: string | string[] }
}

export default function CadastroDadosPage({ searchParams }: CadastroDadosPageProps) {
  const requestedProfile = Array.isArray(searchParams.perfil)
    ? searchParams.perfil[0]
    : searchParams.perfil

  if (!isRegistrationProfileId(requestedProfile)) {
    redirect(registrationRoutes.profile)
  }

  return (
    <RegistrationFormShell currentStep={2} totalSteps={3} title="Criar sua conta">
      <RegistrationDetailsForm profile={requestedProfile} />
    </RegistrationFormShell>
  )
}
