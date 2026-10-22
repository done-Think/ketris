import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { AuthShell } from '@modules/auth'
import { PlatformSignInForm } from '@modules/platform'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('platform.metadata.login', locale)
}

export default function PlatformLoginPage() {
  return (
    <AuthShell mobileVariant="card">
      <PlatformSignInForm />
    </AuthShell>
  )
}
