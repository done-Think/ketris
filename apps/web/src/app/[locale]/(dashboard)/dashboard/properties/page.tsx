import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { PropertiesDashboardPage } from '@modules/properties'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('properties.metadata.dashboard', locale)
}

export default function DashboardPropertiesPage() {
  return <PropertiesDashboardPage />
}
