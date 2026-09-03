import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { PropertyDetailDashboardPage } from '@modules/properties'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('properties.metadata.detail', locale)
}

export default async function DashboardPropertyDetailRoute({
  params,
}: LocaleRoutePageProps<{ id: string }>) {
  const { id } = await params

  return <PropertyDetailDashboardPage propertyId={id} />
}
