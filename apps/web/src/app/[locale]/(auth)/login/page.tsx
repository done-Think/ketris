import { getTranslations } from 'next-intl/server'

import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { AuthShell, LoginForm } from '@modules/auth'

export async function generateMetadata({ params }: LocaleRoutePageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.login' })

  return { title: t('metadataTitle') }
}

export default async function LoginPage({
  searchParams,
}: LocaleRoutePageProps<Record<never, never>, { callbackUrl?: string | string[] }>) {
  const resolvedSearchParams = await searchParams
  const requestedCallback = Array.isArray(resolvedSearchParams?.callbackUrl)
    ? resolvedSearchParams.callbackUrl[0]
    : resolvedSearchParams?.callbackUrl
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
