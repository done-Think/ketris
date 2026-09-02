import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { CreatePropertyDashboardPage } from '@modules/properties'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('properties.metadata.create', locale)
}

export default function CreateDashboardPropertyPage() {
  return <CreatePropertyDashboardPage />
}
