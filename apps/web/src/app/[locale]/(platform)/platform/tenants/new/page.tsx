import { getTranslations } from 'next-intl/server'

import { createLocalizedMetadata } from '@/i18n/metadata'
import { CreateTenantForm, PlatformPageLayout } from '@modules/platform'

export const generateMetadata = () => createLocalizedMetadata('platform.metadata.newTenant')

export default async function PlatformNewTenantPage() {
  const t = await getTranslations('platform.dashboard')

  return (
    <PlatformPageLayout title={t('newTenant')}>
      <CreateTenantForm />
    </PlatformPageLayout>
  )
}
