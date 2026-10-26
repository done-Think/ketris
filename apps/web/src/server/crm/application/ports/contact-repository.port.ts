import type { Contact, ContactUpdate, NewContact } from '../../domain/contact.entity'
import type { CrmListFilters, CrmPage } from '../../types/pagination'

export interface ContactListFilters extends CrmListFilters {
  type?: Contact['type']
  q?: string
  includeArchived?: boolean
  responsavelId?: string
}

export interface ContactRepository {
  create(contact: NewContact): Promise<Contact>
  findManyByTenant(tenantId: string, filters?: ContactListFilters): Promise<CrmPage<Contact>>
  findById(id: string): Promise<Contact | null>
  findByEmail(tenantId: string, email: string): Promise<Contact | null>
  update(id: string, changes: ContactUpdate): Promise<Contact>
  archive(id: string): Promise<Contact>
}
