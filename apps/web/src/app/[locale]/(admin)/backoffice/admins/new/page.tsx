import { getTranslations } from 'next-intl/server'

import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { AuthScreenLayout, CreateAdminForm } from '@modules/auth'

export async function generateMetadata({ params }: LocaleRoutePageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.backoffice' })

  return { title: t('newAdminMetadataTitle') }
}

export default async function BackofficeNewAdminPage({ params }: LocaleRoutePageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.backoffice' })

  return (
    <AuthScreenLayout title={t('newAdminTitle')} subtitle={t('newAdminSubtitle')}>
      <CreateAdminForm />
    </AuthScreenLayout>
  )
}
