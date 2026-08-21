import type { ContactFilter, ContactFilterId, ContactType } from '../types/contact'

export const contactFilters: readonly {
  id: ContactFilterId
  label: ContactFilter
  type: ContactType | null
}[] = [
  { id: 'all', label: 'Todos', type: null },
  { id: 'owner', label: 'Proprietários', type: 'owner' },
  { id: 'renter', label: 'Locatários', type: 'renter' },
  { id: 'broker', label: 'Corretores', type: 'broker' },
]
