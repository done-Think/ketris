import type { Prisma } from '@prisma/client'

import { prisma } from '@server/db/prisma'

import type { Contact, ContactUpdate, NewContact } from '../domain/contact.entity'
import type {
  ContactListFilters,
  ContactRepository,
} from '../application/ports/contact-repository.port'

type ContatoRow = {
  id: string
  tenantId: string
  nome: string
  email: string
  telefone: string | null
  tipo: Contact['type']
  avatarUrl: string | null
  observacoes: string | null
  ultimaInteracao: Date | null
  arquivadoEm: Date | null
  createdAt: Date
  updatedAt: Date
}

function toDomain(row: ContatoRow): Contact {
  return {
    id: row.id,
    tenantId: row.tenantId,
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
  async create(contact: NewContact): Promise<Contact> {
    const row = await prisma.contato.create({
      data: {
        tenantId: contact.tenantId,
        nome: contact.name,
        email: contact.email,
        telefone: contact.phone,
        tipo: contact.type,
        avatarUrl: contact.avatarUrl,
        observacoes: contact.notes,
      },
    })

    return toDomain(row as unknown as ContatoRow)
  }

  async findManyByTenant(tenantId: string, filters?: ContactListFilters): Promise<Contact[]> {
    const where: Prisma.ContatoWhereInput = { tenantId }

    if (filters?.type) where.tipo = filters.type
    if (!filters?.includeArchived) where.arquivadoEm = null
    if (filters?.responsavelId) {
      where.oportunidades = { some: { imovel: { responsavelId: filters.responsavelId } } }
    }

    if (filters?.q) {
      where.OR = [
        { nome: { contains: filters.q, mode: 'insensitive' } },
        { email: { contains: filters.q, mode: 'insensitive' } },
      ]
    }

    const rows = await prisma.contato.findMany({ where, orderBy: { nome: 'asc' } })

    return rows.map((row) => toDomain(row as unknown as ContatoRow))
  }

  async findById(id: string): Promise<Contact | null> {
    const row = await prisma.contato.findUnique({ where: { id } })

    return row ? toDomain(row as unknown as ContatoRow) : null
  }

  async findByEmail(tenantId: string, email: string): Promise<Contact | null> {
    const row = await prisma.contato.findUnique({
      where: { tenantId_email: { tenantId, email } },
    })

    return row ? toDomain(row as unknown as ContatoRow) : null
  }

  async update(id: string, changes: ContactUpdate): Promise<Contact> {
    const row = await prisma.contato.update({
      where: { id },
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

    return toDomain(row as unknown as ContatoRow)
  }

  async archive(id: string): Promise<Contact> {
    const row = await prisma.contato.update({
      where: { id },
      data: { arquivadoEm: new Date() },
    })

    return toDomain(row as unknown as ContatoRow)
  }
}
