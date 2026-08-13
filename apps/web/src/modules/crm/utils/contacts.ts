import type { Opportunity, OpportunityStatus } from '../types/opportunity'

export interface CrmContact {
  id: string
  name: string
  email: string
  phone: string | null
  type: 'Interessado'
  propertyIds: string[]
  opportunityIds: string[]
  latestInteractionAt: string
  latestOpportunityId: string
  latestStatus: OpportunityStatus
}

function normalizeEmail(email: string): string {
  return email.trim().toLocaleLowerCase('pt-BR')
}

function normalizeSearchValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
}

function timestamp(value: string): number {
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

export function buildContactsFromOpportunities(opportunities: Opportunity[]): CrmContact[] {
  const contacts = new Map<
    string,
    CrmContact & { propertyIdSet: Set<string>; opportunityIdSet: Set<string> }
  >()

  const sortedOpportunities = [...opportunities].sort(
    (left, right) => timestamp(right.updatedAt) - timestamp(left.updatedAt),
  )

  sortedOpportunities.forEach((opportunity) => {
    const email = normalizeEmail(opportunity.interessadoEmail)
    if (!email) return

    const existingContact = contacts.get(email)

    if (existingContact) {
      existingContact.propertyIdSet.add(opportunity.imovelId)
      existingContact.opportunityIdSet.add(opportunity.id)

      if (!existingContact.phone && opportunity.interessadoTelefone) {
        existingContact.phone = opportunity.interessadoTelefone
      }

      return
    }

    contacts.set(email, {
      id: email,
      name: opportunity.interessadoNome,
      email,
      phone: opportunity.interessadoTelefone,
      type: 'Interessado',
      propertyIds: [],
      opportunityIds: [],
      propertyIdSet: new Set([opportunity.imovelId]),
      opportunityIdSet: new Set([opportunity.id]),
      latestInteractionAt: opportunity.updatedAt,
      latestOpportunityId: opportunity.id,
      latestStatus: opportunity.status,
    })
  })

  return Array.from(contacts.values()).map(({ propertyIdSet, opportunityIdSet, ...contact }) => ({
    ...contact,
    propertyIds: Array.from(propertyIdSet),
    opportunityIds: Array.from(opportunityIdSet),
  }))
}

export function filterContacts(contacts: CrmContact[], query: string): CrmContact[] {
  const normalizedQuery = normalizeSearchValue(query)
  if (!normalizedQuery) return contacts

  return contacts.filter((contact) =>
    [contact.name, contact.email, contact.phone ?? ''].some((value) =>
      normalizeSearchValue(value).includes(normalizedQuery),
    ),
  )
}
