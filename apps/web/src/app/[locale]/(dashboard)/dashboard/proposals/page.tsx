import { createLocalizedMetadata } from '@/i18n/metadata'
import { ProposalsDashboardPage } from '@modules/proposals'

export const generateMetadata = () => createLocalizedMetadata('dashboard.metadata.proposals')

export default function DashboardProposalsPage() {
  return <ProposalsDashboardPage />
}
