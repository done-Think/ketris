import { getTranslations } from 'next-intl/server'

import { createLocalizedMetadata } from '@/i18n/metadata'
import { AuthScreenLayout } from '@modules/auth'
import { PlatformSignInForm } from '@modules/platform'

export const generateMetadata = () => createLocalizedMetadata('platform.metadata.login')

export default async function PlatformLoginPage() {
  const t = await getTranslations('platform.login')

  return (
    <AuthScreenLayout title={t('title')} subtitle={t('subtitle')}>
      <PlatformSignInForm />
    </AuthScreenLayout>
  )
}
