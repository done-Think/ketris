import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { ContactsList } from '@modules/crm/components/ContactsList'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('crm.metadata.contacts', locale)
}

export default function CrmContactsPage() {
  return <ContactsList />
}
