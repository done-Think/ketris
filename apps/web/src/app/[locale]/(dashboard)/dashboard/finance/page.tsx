import { createLocalizedMetadata } from '@/i18n/metadata'
import { FinancialDashboardPage } from '@modules/financial'

export const generateMetadata = () => createLocalizedMetadata('dashboard.metadata.finance')

export default function DashboardFinancialPage() {
  return <FinancialDashboardPage />
}
