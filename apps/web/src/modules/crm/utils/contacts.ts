import type { ContactListItem, ContactType } from '../types/contact'

function normalizeSearchValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
}

export function filterContacts(
  contacts: readonly ContactListItem[],
  query: string,
  type: ContactType | null = null,
): ContactListItem[] {
  const normalizedQuery = normalizeSearchValue(query)

  return contacts.filter((contact) => {
    if (type && contact.type !== type) return false
    if (!normalizedQuery) return true

    return [contact.name, contact.email, contact.phone].some((value) =>
      normalizeSearchValue(value).includes(normalizedQuery),
    )
  })
}
