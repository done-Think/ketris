import { getTranslations } from 'next-intl/server'

import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { AuthScreenLayout, SignInForm } from '@modules/auth'

export async function generateMetadata({ params }: LocaleRoutePageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.backoffice' })

  return { title: t('loginMetadataTitle') }
}

export default async function BackofficeSignInPage({ params }: LocaleRoutePageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.backoffice' })

  return (
    <AuthScreenLayout title={t('loginTitle')} subtitle={t('loginSubtitle')}>
      <SignInForm />
    </AuthScreenLayout>
  )
}
