import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { AgencyOverviewPage } from '@modules/agency-dashboard'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('dashboard.metadata.agencyOverview', locale)
}

export default function DashboardAgencyOverviewPage() {
  return <AgencyOverviewPage />
}
