import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { PlatformPlansPage } from '@modules/platform'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params
  return createLocalizedMetadata('platform.metadata.plans', locale)
}

export default async function PlatformPlansRoute({ params }: LocaleRoutePageProps) {
  await params
  return <PlatformPlansPage />
}
