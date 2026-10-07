import { contactFilters } from '../config/contact-filters'
import type {
  ContactFilter,
  ContactListItem,
  ContactType,
  ContactsPageResult,
} from '../types/contact'

export const contactsDefaultPageSize = 5

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

export function paginateContacts(
  contacts: readonly ContactListItem[],
  requestedPage = 1,
  pageSize = contactsDefaultPageSize,
): ContactsPageResult {
  const totalCount = contacts.length
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))
  const normalizedPage = Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1
  const page = Math.min(Math.max(normalizedPage, 1), pageCount)
  const startIndex = (page - 1) * pageSize

  return {
    items: contacts.slice(startIndex, startIndex + pageSize),
    page,
    pageCount,
    totalCount,
  }
}

export function getContactFilterCount(
  contacts: readonly ContactListItem[],
  filter: ContactFilter,
): number {
  const selectedType = contactFilters.find(({ label }) => label === filter)?.type ?? null

  if (!selectedType) return contacts.length

  return contacts.filter((contact) => contact.type === selectedType).length
}
