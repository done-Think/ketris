import { getTranslations } from 'next-intl/server'

import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { CreateTenantForm, PlatformPageLayout } from '@modules/platform'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('platform.metadata.newTenant', locale)
}

export default async function PlatformNewTenantPage({ params }: LocaleRoutePageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'platform.dashboard' })

  return (
    <PlatformPageLayout title={t('newTenant')}>
      <CreateTenantForm />
    </PlatformPageLayout>
  )
}
