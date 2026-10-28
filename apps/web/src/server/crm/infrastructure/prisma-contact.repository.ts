import type { CrmPage } from '../types/pagination'
import { crmChangedFields } from './crm-changed-fields'
import { crmMutationAuthor } from './crm-mutation-author'
import { readCrmPage } from './read-crm-page'

import type { ContactRow, CrmDatabase, CrmScope } from '../types/prisma'
import { recordCrmAudit } from './record-crm-audit'

import type {
  ContactListFilters,
  ContactRepository,
} from '../application/ports/contact-repository.port'
import type { Contact, ContactUpdate, NewContact } from '../domain/contact.entity'

function toDomain(row: ContactRow): Contact {
  return {
    id: row.id,
    tenantId: row.tenantId,
    createdById: row.createdById,
    name: row.name,
    email: row.email,
    phone: row.phone,
    type: row.type,
    avatarUrl: row.avatarUrl,
    notes: row.notes,
    lastInteraction: row.lastInteraction,
    archivedAt: row.archivedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export class PrismaContactRepository implements ContactRepository {
  constructor(
    private readonly db: CrmDatabase,
    private readonly scope: CrmScope,
  ) {}

  async create(contact: NewContact): Promise<Contact> {
    const authorId = await crmMutationAuthor(this.db, this.scope)
    const row = await this.db.contact.create({
      data: {
        tenantId: this.scope.actorTenantId,
        createdById: authorId,
        updatedById: authorId,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        type: contact.type,
        avatarUrl: contact.avatarUrl,
        notes: contact.notes,
      },
    })

    await recordCrmAudit(this.db, this.scope, 'CONTACT', row.id, 'CREATED', [])
    return toDomain(row)
  }

  async findManyByTenant(
    tenantId: string,
    filters?: ContactListFilters,
  ): Promise<CrmPage<Contact>> {
    const page = await readCrmPage(this.db, this.scope, 'contact', filters)
    const rows = await this.db.contact.findMany({
      where: { id: { in: page.ids }, tenantId: this.scope.actorTenantId },
    })
    const byId = new Map(rows.map((row) => [row.id, toDomain(row)]))
    return {
      pagination: page.pagination,
      groups: page.groups,
      items: page.ids.flatMap((id) => {
        const item = byId.get(id)
        return item ? [item] : []
      }),
    }
  }

  async findById(id: string): Promise<Contact | null> {
    const row = await this.db.contact.findFirst({
      where: {
        id,
        tenantId: this.scope.actorTenantId,
        ...(this.scope.actorRole === 'AGENT'
          ? {
              OR: [
                { createdById: this.scope.actorId ?? '' },
                {
                  opportunities: {
                    some: {
                      tenantId: this.scope.actorTenantId,
                      responsibleId: this.scope.actorId ?? '',
                    },
                  },
                },
              ],
            }
          : {}),
      },
    })

    return row ? toDomain(row) : null
  }

  async findByEmail(tenantId: string, email: string): Promise<Contact | null> {
    const row = await this.db.contact.findUnique({
      where: { tenantId_email: { tenantId, email } },
    })

    return row ? toDomain(row) : null
  }

  async update(id: string, changes: ContactUpdate): Promise<Contact> {
    const authorId = await crmMutationAuthor(this.db, this.scope)
    const current = await this.findById(id)
    const changedFields = current ? crmChangedFields(current, changes) : []
    const row = await this.db.contact.update({
      where: {
        id,
        tenantId: this.scope.actorTenantId,
        ...(this.scope.actorRole === 'AGENT'
          ? {
              OR: [
                { createdById: this.scope.actorId ?? '' },
                {
                  opportunities: {
                    some: {
                      tenantId: this.scope.actorTenantId,
                      responsibleId: this.scope.actorId ?? '',
                    },
                  },
                },
              ],
            }
          : {}),
      },
      data: {
        updatedById: authorId,
        name: changes.name,
        email: changes.email,
        phone: changes.phone,
        type: changes.type,
        avatarUrl: changes.avatarUrl,
        notes: changes.notes,
        lastInteraction: changes.lastInteraction,
      },
    })

    await recordCrmAudit(this.db, this.scope, 'CONTACT', row.id, 'UPDATED', changedFields)
    return toDomain(row)
  }

  async archive(id: string): Promise<Contact> {
    const authorId = await crmMutationAuthor(this.db, this.scope)
    const current = await this.findById(id)
    if (current?.archivedAt) return current
    const row = await this.db.contact.update({
      where: {
        id,
        tenantId: this.scope.actorTenantId,
        ...(this.scope.actorRole === 'AGENT'
          ? {
              OR: [
                { createdById: this.scope.actorId ?? '' },
                {
                  opportunities: {
                    some: {
                      tenantId: this.scope.actorTenantId,
                      responsibleId: this.scope.actorId ?? '',
                    },
                  },
                },
              ],
            }
          : {}),
      },
      data: { archivedAt: new Date(), archivedById: authorId, updatedById: authorId },
    })

    await recordCrmAudit(this.db, this.scope, 'CONTACT', row.id, 'ARCHIVED', ['archivedAt'])
    return toDomain(row)
  }
}
