import { getTranslations } from 'next-intl/server'

import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { AuthScreenLayout } from '@modules/auth'
import { PlatformSignInForm } from '@modules/platform'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('platform.metadata.login', locale)
}

export default async function PlatformLoginPage({ params }: LocaleRoutePageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'platform.login' })

  return (
    <AuthScreenLayout title={t('title')} subtitle={t('subtitle')}>
      <PlatformSignInForm />
    </AuthScreenLayout>
  )
}
