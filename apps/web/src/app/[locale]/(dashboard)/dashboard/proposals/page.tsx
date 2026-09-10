import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { ProposalsDashboardPage } from '@modules/proposals'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('dashboard.metadata.proposals', locale)
}

export default function DashboardProposalsPage() {
  return <ProposalsDashboardPage />
}
