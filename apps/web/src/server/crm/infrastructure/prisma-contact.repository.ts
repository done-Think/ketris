import type { CrmPage } from '../types/pagination'
import { crmChangedFields } from './crm-changed-fields'
import { readCrmPage } from './read-crm-page'

import type { ContatoRow, CrmDatabase, CrmScope } from '../types/prisma'
import { recordCrmAudit } from './record-crm-audit'

import type {
  ContactListFilters,
  ContactRepository,
} from '../application/ports/contact-repository.port'
import type { Contact, ContactUpdate, NewContact } from '../domain/contact.entity'

function toDomain(row: ContatoRow): Contact {
  return {
    id: row.id,
    tenantId: row.tenantId,
    createdById: row.createdById,
    name: row.nome,
    email: row.email,
    phone: row.telefone,
    type: row.tipo,
    avatarUrl: row.avatarUrl,
    notes: row.observacoes,
    lastInteraction: row.ultimaInteracao,
    archivedAt: row.arquivadoEm,
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
    const row = await this.db.contato.create({
      data: {
        tenantId: this.scope.actorTenantId,
        createdById: this.scope.actorId ?? null,
        nome: contact.name,
        email: contact.email,
        telefone: contact.phone,
        tipo: contact.type,
        avatarUrl: contact.avatarUrl,
        observacoes: contact.notes,
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
    const rows = await this.db.contato.findMany({
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
    const row = await this.db.contato.findFirst({
      where: {
        id,
        tenantId: this.scope.actorTenantId,
        ...(this.scope.actorPapel === 'AGENT'
          ? {
              OR: [
                { createdById: this.scope.actorId ?? '' },
                {
                  oportunidades: {
                    some: {
                      tenantId: this.scope.actorTenantId,
                      responsavelId: this.scope.actorId ?? '',
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
    const row = await this.db.contato.findUnique({
      where: { tenantId_email: { tenantId, email } },
    })

    return row ? toDomain(row) : null
  }

  async update(id: string, changes: ContactUpdate): Promise<Contact> {
    const current = await this.findById(id)
    const changedFields = current ? crmChangedFields(current, changes) : []
    const row = await this.db.contato.update({
      where: {
        id,
        tenantId: this.scope.actorTenantId,
        ...(this.scope.actorPapel === 'AGENT'
          ? {
              OR: [
                { createdById: this.scope.actorId ?? '' },
                {
                  oportunidades: {
                    some: {
                      tenantId: this.scope.actorTenantId,
                      responsavelId: this.scope.actorId ?? '',
                    },
                  },
                },
              ],
            }
          : {}),
      },
      data: {
        nome: changes.name,
        email: changes.email,
        telefone: changes.phone,
        tipo: changes.type,
        avatarUrl: changes.avatarUrl,
        observacoes: changes.notes,
        ultimaInteracao: changes.lastInteraction,
      },
    })

    await recordCrmAudit(this.db, this.scope, 'CONTACT', row.id, 'UPDATED', changedFields)
    return toDomain(row)
  }

  async archive(id: string): Promise<Contact> {
    const row = await this.db.contato.update({
      where: {
        id,
        tenantId: this.scope.actorTenantId,
        ...(this.scope.actorPapel === 'AGENT'
          ? {
              OR: [
                { createdById: this.scope.actorId ?? '' },
                {
                  oportunidades: {
                    some: {
                      tenantId: this.scope.actorTenantId,
                      responsavelId: this.scope.actorId ?? '',
                    },
                  },
                },
              ],
            }
          : {}),
      },
      data: { arquivadoEm: new Date() },
    })

    await recordCrmAudit(this.db, this.scope, 'CONTACT', row.id, 'ARCHIVED', ['archivedAt'])
    return toDomain(row)
  }
}
