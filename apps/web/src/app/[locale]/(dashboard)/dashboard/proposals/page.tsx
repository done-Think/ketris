import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { ProposalsManagementPage } from '@modules/crm/components/ProposalsManagementPage'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('dashboard.metadata.proposals', locale)
}

export default function DashboardProposalsPage() {
  return <ProposalsManagementPage />
}
