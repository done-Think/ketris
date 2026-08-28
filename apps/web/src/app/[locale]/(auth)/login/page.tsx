import { getTranslations } from 'next-intl/server'

import { AuthShell, LoginForm } from '@modules/auth'

export async function generateMetadata() {
  const t = await getTranslations('auth.login')

  return { title: t('metadataTitle') }
}

type LoginPageProps = {
  searchParams: { callbackUrl?: string | string[] }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const requestedCallback = Array.isArray(searchParams.callbackUrl)
    ? searchParams.callbackUrl[0]
    : searchParams.callbackUrl
  const callbackUrl =
    requestedCallback?.startsWith('/') && !requestedCallback.startsWith('//')
      ? requestedCallback
      : '/dashboard'

  return (
    <AuthShell mobileVariant="card">
      <LoginForm callbackUrl={callbackUrl} />
    </AuthShell>
  )
}
