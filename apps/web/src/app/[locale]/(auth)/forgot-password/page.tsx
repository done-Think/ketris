import { getTranslations } from 'next-intl/server'

import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { PasswordRecoveryScreen } from '@modules/auth'

export async function generateMetadata({ params }: LocaleRoutePageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.passwordRecovery' })

  return { title: t('metadataTitle') }
}

export default function ForgotPasswordPage() {
  return <PasswordRecoveryScreen />
}
