import { ScopedMessages } from '@/i18n/scoped-messages'
import { dashboardMessageNamespaces } from '@/i18n/message-selection'
import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { DashboardOverviewPage } from '@modules/dashboard'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('dashboard.metadata.overview', locale)
}

export default function DashboardPage() {
  return (
    <ScopedMessages
      namespaces={[
        ...dashboardMessageNamespaces,
        'dashboard.overview',
        'dashboard.agencyOverview',
        'dashboard.leadSources',
      ]}
    >
      <DashboardOverviewPage />
    </ScopedMessages>
  )
}
