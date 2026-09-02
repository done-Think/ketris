import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { DashboardOverviewPage } from '@modules/dashboard'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('dashboard.metadata.overview', locale)
}

export default function DashboardPage() {
  return <DashboardOverviewPage />
}
