import { requireDashboardFeature } from '@shared/lib/auth/require-dashboard-feature'
import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { ContactsPage } from '@modules/crm/components/ContactsPage'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('crm.metadata.contacts', locale)
}

export default async function CrmContactsPage() {
  await requireDashboardFeature('contacts')
  return <ContactsPage />
}
