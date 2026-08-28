import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { getLocalizedPathname } from '@/i18n/locale-prefix'
import {
  authRoutes,
  isRegistrationProfileId,
  RegistrationDetailsForm,
  RegistrationFormShell,
} from '@modules/auth'

export async function generateMetadata() {
  const t = await getTranslations('auth.registerDetails')

  return { title: t('metadataTitle') }
}

type RegisterDetailsPageProps = {
  params: { locale: string }
  searchParams: { profile?: string | string[] }
}

export default async function RegisterDetailsPage({
  params,
  searchParams,
}: RegisterDetailsPageProps) {
  const t = await getTranslations('auth.registerDetails')
  const requestedProfile = Array.isArray(searchParams.profile)
    ? searchParams.profile[0]
    : searchParams.profile

  if (!isRegistrationProfileId(requestedProfile)) {
    redirect(getLocalizedPathname(authRoutes.register, params.locale))
  }

  return (
    <RegistrationFormShell currentStep={2} totalSteps={3} title={t('title')}>
      <RegistrationDetailsForm profile={requestedProfile} />
    </RegistrationFormShell>
  )
}
