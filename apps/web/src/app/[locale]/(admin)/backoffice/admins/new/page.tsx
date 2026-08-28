import { getTranslations } from 'next-intl/server'

import { AuthScreenLayout, CreateAdminForm } from '@modules/auth'

export async function generateMetadata() {
  const t = await getTranslations('auth.backoffice')

  return { title: t('newAdminMetadataTitle') }
}

export default async function BackofficeNovoAdministradorPage() {
  const t = await getTranslations('auth.backoffice')

  return (
    <AuthScreenLayout title={t('newAdminTitle')} subtitle={t('newAdminSubtitle')}>
      <CreateAdminForm />
    </AuthScreenLayout>
  )
}
