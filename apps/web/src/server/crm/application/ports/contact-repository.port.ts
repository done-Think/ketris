import type { Contact, ContactUpdate, NewContact } from '../../domain/contact.entity'

export interface ContactListFilters {
  type?: Contact['type']
  q?: string
  includeArchived?: boolean
  /** Set only when the actor is an AGENT — scopes to contacts reachable through their own properties. */
  responsavelId?: string
}

export interface ContactRepository {
  create(contact: NewContact): Promise<Contact>
  findManyByTenant(tenantId: string, filters?: ContactListFilters): Promise<Contact[]>
  findById(id: string): Promise<Contact | null>
  findByEmail(tenantId: string, email: string): Promise<Contact | null>
  update(id: string, changes: ContactUpdate): Promise<Contact>
  archive(id: string): Promise<Contact>
}
