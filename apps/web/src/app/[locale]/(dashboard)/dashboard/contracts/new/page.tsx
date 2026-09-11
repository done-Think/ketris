import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { ContractsCreatePage } from '@modules/contracts'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('contracts.metadata.create', locale)
}

export default function DashboardCreateContractPage() {
  return <ContractsCreatePage />
}
