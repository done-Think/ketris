import { getTranslations } from 'next-intl/server'

import { PasswordRecoveryScreen } from '@modules/auth'

export async function generateMetadata() {
  const t = await getTranslations('auth.passwordRecovery')

  return { title: t('metadataTitle') }
}

export default function ForgotPasswordPage() {
  return <PasswordRecoveryScreen />
}
