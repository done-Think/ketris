import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { MaintenanceDashboardPage } from '@modules/maintenance'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params
  return createLocalizedMetadata('dashboard.metadata.maintenance', locale)
}

export default function DashboardMaintenancePage() {
  return <MaintenanceDashboardPage />
}
