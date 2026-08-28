import { createLocalizedMetadata } from '@/i18n/metadata'
import { DashboardOverviewPage } from '@modules/dashboard'

export const generateMetadata = () => createLocalizedMetadata('dashboard.metadata.overview')

export default function DashboardPage() {
  return <DashboardOverviewPage />
}
