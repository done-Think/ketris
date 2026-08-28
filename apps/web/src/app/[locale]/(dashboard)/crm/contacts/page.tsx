import { createLocalizedMetadata } from '@/i18n/metadata'
import { ContactsList } from '@modules/crm/components/ContactsList'

export const generateMetadata = () => createLocalizedMetadata('crm.metadata.contacts')

export default function CrmContactsPage() {
  return <ContactsList />
}
