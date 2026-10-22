import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { PlatformFinancePage } from '@modules/platform'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params
  return createLocalizedMetadata('platform.metadata.finance', locale)
}

export default async function PlatformFinanceRoute({ params }: LocaleRoutePageProps) {
  await params
  return <PlatformFinancePage />
}
