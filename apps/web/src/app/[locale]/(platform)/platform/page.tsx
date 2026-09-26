import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { PlatformOverview } from '@modules/platform'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('platform.metadata.dashboard', locale)
}

export default async function PlatformDashboardPage({ params }: LocaleRoutePageProps) {
  await params

  return <PlatformOverview />
}
