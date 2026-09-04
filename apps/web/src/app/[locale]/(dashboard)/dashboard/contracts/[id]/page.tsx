import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { ContractDetailDashboardPage } from '@modules/contracts'

export const metadata = { title: 'Ketris | Detalhe do Contrato' }

export default async function DashboardContractDetailRoute({
  params,
}: LocaleRoutePageProps<{ id: string }>) {
  const { id } = await params

  return <ContractDetailDashboardPage contractId={id} />
}
