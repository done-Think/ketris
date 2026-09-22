import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { BrokerTeamDashboardPage } from '@modules/team'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('dashboard.metadata.team', locale)
}

export default function DashboardTeamPage() {
  return <BrokerTeamDashboardPage />
}
