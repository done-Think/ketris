import type { ContactFilter, ContactFilterKey, ContactType } from '../types/contact'

export const contactFilters: readonly {
  label: ContactFilter
  labelKey: ContactFilterKey
  type: ContactType | null
}[] = [
  { label: 'Todos', labelKey: 'all', type: null },
  { label: 'Proprietários', labelKey: 'owners', type: 'Proprietário' },
  { label: 'Locatários', labelKey: 'tenants', type: 'Locatário' },
  { label: 'Corretores', labelKey: 'brokers', type: 'Corretor' },
]
