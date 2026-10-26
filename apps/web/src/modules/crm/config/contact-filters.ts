import type { ContactFilter, ContactFilterKey, ContactType } from '../types/contact'

export const contactFilters: readonly {
  label: ContactFilter
  labelKey: ContactFilterKey
  type: ContactType | null
}[] = [
  { label: 'ALL', labelKey: 'all', type: null },
  { label: 'PROPRIETARIO', labelKey: 'owners', type: 'PROPRIETARIO' },
  { label: 'LOCATARIO', labelKey: 'tenants', type: 'LOCATARIO' },
  { label: 'CORRETOR', labelKey: 'brokers', type: 'CORRETOR' },
]
