import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { PlatformSystemPage } from '@modules/platform'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params
  return createLocalizedMetadata('platform.metadata.system', locale)
}

export default async function PlatformSystemRoute({ params }: LocaleRoutePageProps) {
  await params
  return <PlatformSystemPage />
}
