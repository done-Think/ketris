import { ContractDetailDashboardPage } from '@modules/contracts'
import type { DashboardContractDetailRouteProps } from '@modules/contracts'

export const metadata = { title: 'Ketris | Detalhe do Contrato' }

export default function DashboardContractDetailRoute({
  params,
}: DashboardContractDetailRouteProps) {
  return <ContractDetailDashboardPage contractId={params.id} />
}
