import { getTranslations } from 'next-intl/server'

import { createLocalizedMetadata } from '@/i18n/metadata'
import { CreatePlatformAdminForm, PlatformPageLayout } from '@modules/platform'

export const generateMetadata = () => createLocalizedMetadata('platform.metadata.newAdmin')

export default async function PlatformNewAdminPage() {
  const t = await getTranslations('platform.newAdmin')

  return (
    <PlatformPageLayout title={t('title')}>
      <CreatePlatformAdminForm />
    </PlatformPageLayout>
  )
}
