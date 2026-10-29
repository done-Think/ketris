import type { ContactFilter, ContactFilterKey, ContactType } from '../types/contact'

export const contactFilters: readonly {
  label: ContactFilter
  labelKey: ContactFilterKey
  type: ContactType | null
}[] = [
  { label: 'ALL', labelKey: 'all', type: null },
  { label: 'OWNER', labelKey: 'owners', type: 'OWNER' },
  { label: 'RENTER', labelKey: 'tenants', type: 'RENTER' },
  { label: 'BROKER', labelKey: 'brokers', type: 'BROKER' },
]
