import { getTranslations } from 'next-intl/server'

import { RegistrationProfileScreen } from '@modules/auth'

export async function generateMetadata() {
  const t = await getTranslations('auth.register')

  return { title: t('metadataTitle') }
}

export default function RegisterPage() {
  return <RegistrationProfileScreen />
}
