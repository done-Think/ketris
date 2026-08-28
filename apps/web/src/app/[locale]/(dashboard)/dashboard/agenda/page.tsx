import { createLocalizedMetadata } from '@/i18n/metadata'
import { AgendaDashboardPage } from '@modules/agenda'

export const generateMetadata = () => createLocalizedMetadata('dashboard.metadata.agenda')

export default function DashboardAgendaPage() {
  return <AgendaDashboardPage />
}
