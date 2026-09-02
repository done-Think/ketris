import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { AgendaDashboardPage } from '@modules/agenda'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('dashboard.metadata.agenda', locale)
}

export default function DashboardAgendaPage() {
  return <AgendaDashboardPage />
}
