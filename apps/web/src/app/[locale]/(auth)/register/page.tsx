import { getTranslations } from 'next-intl/server'

import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { RegistrationProfileScreen } from '@modules/auth'

export async function generateMetadata({ params }: LocaleRoutePageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.register' })

  return { title: t('metadataTitle') }
}

export default function RegisterPage() {
  return <RegistrationProfileScreen />
}
