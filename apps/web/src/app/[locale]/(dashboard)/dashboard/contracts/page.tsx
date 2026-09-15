import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { ContractsDashboardPage } from '@modules/contracts'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('contracts.metadata.dashboard', locale)
}

export default function DashboardContractsPage() {
  return <ContractsDashboardPage />
}
