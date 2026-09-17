import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { ContractDetailDashboardPage } from '@modules/contracts'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('contracts.metadata.detail', locale)
}

export default async function DashboardContractDetailRoute({
  params,
}: LocaleRoutePageProps<{ id: string }>) {
  const { id } = await params

  return <ContractDetailDashboardPage contractId={id} />
}
