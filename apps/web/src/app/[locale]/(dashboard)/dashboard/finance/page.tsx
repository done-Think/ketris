import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { FinancialDashboardPage } from '@modules/financial'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('dashboard.metadata.finance', locale)
}

export default function DashboardFinancialPage() {
  return <FinancialDashboardPage />
}
