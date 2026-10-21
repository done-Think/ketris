import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { PlatformTenantDetailPage } from '@modules/platform'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('platform.metadata.tenant', locale)
}

export default async function PlatformTenantPage({ params }: LocaleRoutePageProps<{ id: string }>) {
  const { id } = await params

  return <PlatformTenantDetailPage tenantId={id} />
}
