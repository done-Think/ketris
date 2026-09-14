import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { getLocalizedPathname } from '@/i18n/locale-prefix'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import {
  authRoutes,
  isRegistrationProfileId,
  RegistrationDetailsForm,
  RegistrationFormShell,
} from '@modules/auth'

export async function generateMetadata({
  params,
}: LocaleRoutePageProps<Record<never, never>, { profile?: string | string[] }>) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.registerDetails' })

  return { title: t('metadataTitle') }
}

export default async function RegisterDetailsPage({
  params,
  searchParams,
}: LocaleRoutePageProps<Record<never, never>, { profile?: string | string[] }>) {
  const { locale } = await params
  const resolvedSearchParams = await searchParams
  const t = await getTranslations({ locale, namespace: 'auth.registerDetails' })
  const requestedProfile = Array.isArray(resolvedSearchParams?.profile)
    ? resolvedSearchParams.profile[0]
    : resolvedSearchParams?.profile

  if (!isRegistrationProfileId(requestedProfile)) {
    redirect(getLocalizedPathname(authRoutes.register, locale))
  }

  return (
    <RegistrationFormShell currentStep={2} totalSteps={3} title={t('title')}>
      <RegistrationDetailsForm profile={requestedProfile} />
    </RegistrationFormShell>
  )
}
