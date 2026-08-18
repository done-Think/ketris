import { PropertyDetailDashboardPage } from '@modules/properties'
import type { DashboardPropertyDetailRouteProps } from '@modules/properties'

export const metadata = { title: 'Detalhe do Imóvel | Ketris' }

export default function DashboardPropertyDetailRoute({
  params,
}: DashboardPropertyDetailRouteProps) {
  return <PropertyDetailDashboardPage propertyId={params.id} />
}
