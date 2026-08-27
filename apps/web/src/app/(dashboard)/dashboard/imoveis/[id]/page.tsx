import { PropertyDetailDashboardPage } from '@modules/properties'
import type { DashboardPropertyDetailRouteProps } from '@modules/properties'

export const metadata = { title: 'Ketris | Detalhe do Imóvel' }

export default function DashboardPropertyDetailRoute({
  params,
}: DashboardPropertyDetailRouteProps) {
  return <PropertyDetailDashboardPage propertyId={params.id} />
}
