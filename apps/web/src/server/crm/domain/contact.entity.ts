export type ContactType = 'PROPRIETARIO' | 'LOCATARIO' | 'CORRETOR'

export interface Contact {
  id: string
  tenantId: string
  name: string
  email: string
  phone: string | null
  type: ContactType
  avatarUrl: string | null
  notes: string | null
  lastInteraction: Date | null
  archivedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/** Contact plus what the CRM listing displays and the database doesn't store on the row itself. */
export interface ContactListItem extends Contact {
  propertyCount: number
}

export interface NewContact {
  tenantId: string
  name: string
  email: string
  phone: string | null
  type: ContactType
  avatarUrl: string | null
  notes: string | null
}

export interface ContactUpdate {
  name?: string
  email?: string
  phone?: string | null
  type?: ContactType
  avatarUrl?: string | null
  notes?: string | null
  lastInteraction?: Date | null
}
