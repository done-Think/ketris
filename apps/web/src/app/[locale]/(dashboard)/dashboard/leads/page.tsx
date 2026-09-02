import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { LeadsDashboardPage } from '@modules/crm'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('dashboard.metadata.leads', locale)
}

export default function DashboardLeadsPage() {
  return <LeadsDashboardPage />
}
