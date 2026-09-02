import { getTranslations } from 'next-intl/server'

import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { CreatePlatformAdminForm, PlatformPageLayout } from '@modules/platform'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('platform.metadata.newAdmin', locale)
}

export default async function PlatformNewAdminPage({ params }: LocaleRoutePageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'platform.newAdmin' })

  return (
    <PlatformPageLayout title={t('title')}>
      <CreatePlatformAdminForm />
    </PlatformPageLayout>
  )
}
