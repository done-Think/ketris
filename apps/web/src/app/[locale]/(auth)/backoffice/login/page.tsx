import { getTranslations } from 'next-intl/server'

import { AuthScreenLayout, SignInForm } from '@modules/auth'

export async function generateMetadata() {
  const t = await getTranslations('auth.backoffice')

  return { title: t('loginMetadataTitle') }
}

export default async function BackofficeSignInPage() {
  const t = await getTranslations('auth.backoffice')

  return (
    <AuthScreenLayout title={t('loginTitle')} subtitle={t('loginSubtitle')}>
      <SignInForm />
    </AuthScreenLayout>
  )
}
