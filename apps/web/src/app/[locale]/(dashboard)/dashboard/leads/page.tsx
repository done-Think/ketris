import { createLocalizedMetadata } from '@/i18n/metadata'
import { LeadsDashboardPage } from '@modules/crm'

export const generateMetadata = () => createLocalizedMetadata('dashboard.metadata.leads')

export default function DashboardLeadsPage() {
  return <LeadsDashboardPage />
}
