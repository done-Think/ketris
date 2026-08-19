import type { ContactFilter, ContactType } from '../types/contact'

export const contactFilters: readonly { label: ContactFilter; type: ContactType | null }[] = [
  { label: 'Todos', type: null },
  { label: 'Proprietários', type: 'Proprietário' },
  { label: 'Locatários', type: 'Locatário' },
  { label: 'Corretores', type: 'Corretor' },
]
