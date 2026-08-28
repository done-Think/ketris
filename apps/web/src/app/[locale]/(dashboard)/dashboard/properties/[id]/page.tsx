import { createLocalizedMetadata } from '@/i18n/metadata'
import { PropertyDetailDashboardPage } from '@modules/properties'
import type { DashboardPropertyDetailRouteProps } from '@modules/properties'

export const generateMetadata = () => createLocalizedMetadata('properties.metadata.detail')

export default function DashboardPropertyDetailRoute({
  params,
}: DashboardPropertyDetailRouteProps) {
  return <PropertyDetailDashboardPage propertyId={params.id} />
}
