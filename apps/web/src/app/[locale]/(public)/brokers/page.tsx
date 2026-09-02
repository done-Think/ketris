import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { BrokersPage } from '@modules/marketplace'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('marketplace.metadata.brokers', locale)
}

export default function BrokersRoutePage() {
  return <BrokersPage />
}
