import { Prisma, type PrestadorManutencao } from '@prisma/client'
import { prisma } from '@server/db/prisma'
import { ConflictError } from '@server/shared/errors'
import { createHash } from 'node:crypto'
import type { MaintenanceProviderRepository } from '../application/ports/maintenance-provider-repository.port'
import {
  MaintenanceProviderAlreadyExistsError,
  MaintenanceProviderInactiveError,
  MaintenanceProviderNotFoundError,
} from '../domain/errors'
import type {
  MaintenanceProviderChanges,
  MaintenanceProviderFilters,
  MaintenanceProviderRecord,
} from '../types/maintenance-provider'
import type { MaintenanceActor, MaintenanceProvider } from '../types/maintenance-ticket'
import { recordMaintenanceProviderAudit } from './record-maintenance-provider-audit'

export function maintenanceProviderFingerprint(provider: MaintenanceProvider) {
  return createHash('sha256')
    .update(
      JSON.stringify([
        provider.name,
        provider.phone ?? null,
        provider.email ?? null,
        provider.notes ?? null,
      ]),
    )
    .digest('hex')
}

export function toMaintenanceProvider(row: PrestadorManutencao): MaintenanceProviderRecord {
  return {
    id: row.id,
    name: row.nome,
    phone: row.telefone,
    email: row.email,
    notes: row.observacoes,
    active: row.ativo,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function resolveMaintenanceProvider(
  db: Prisma.TransactionClient,
  actor: MaintenanceActor,
  tenantId: string,
  provider: MaintenanceProvider,
): Promise<MaintenanceProviderRecord> {
  if (provider.id) {
    await db.$queryRaw`SELECT id FROM prestadores_manutencao WHERE id = ${provider.id} AND "tenantId" = ${tenantId} FOR UPDATE`
    const row = await db.prestadorManutencao.findFirst({ where: { id: provider.id, tenantId } })
    if (!row) throw new MaintenanceProviderNotFoundError()
    if (!row.ativo) throw new MaintenanceProviderInactiveError()
    return toMaintenanceProvider(row)
  }
  const fingerprint = maintenanceProviderFingerprint(provider)
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`maintenance-provider:${tenantId}:${fingerprint}`}, 0))`
  await db.$queryRaw`SELECT id FROM prestadores_manutencao WHERE "tenantId" = ${tenantId} AND fingerprint = ${fingerprint} FOR UPDATE`
  const current = await db.prestadorManutencao.findUnique({
    where: { tenantId_fingerprint: { tenantId, fingerprint } },
  })
  if (current) {
    if (!current.ativo) throw new MaintenanceProviderInactiveError()
    return toMaintenanceProvider(current)
  }
  const row = await db.prestadorManutencao.create({
    data: {
      tenantId,
      fingerprint,
      nome: provider.name,
      telefone: provider.phone ?? null,
      email: provider.email ?? null,
      observacoes: provider.notes ?? null,
      createdById: actor.actorId,
      updatedById: actor.actorId,
    },
  })
  await recordMaintenanceProviderAudit(db, actor, row.id, tenantId, 'CREATED', [])
  return toMaintenanceProvider(row)
}

export class PrismaMaintenanceProviderRepository implements MaintenanceProviderRepository {
  async list(tenantId: string, filters: MaintenanceProviderFilters) {
    const where: Prisma.PrestadorManutencaoWhereInput = {
      tenantId,
      ...(filters.includeInactive ? {} : { ativo: true }),
      ...(filters.search?.trim()
        ? {
            OR: ['nome', 'telefone', 'email'].map((field) => ({
              [field]: { contains: filters.search!.trim(), mode: 'insensitive' },
            })),
          }
        : {}),
    }
    const pageSize = filters.pageSize ?? 5
    return prisma.$transaction(
      async (tx) => {
        const totalCount = await tx.prestadorManutencao.count({ where })
        const page = Math.min(filters.page ?? 1, Math.max(1, Math.ceil(totalCount / pageSize)))
        const rows = await tx.prestadorManutencao.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: [{ nome: 'asc' }, { id: 'asc' }],
        })
        return { items: rows.map(toMaintenanceProvider), totalCount, page, pageSize }
      },
      { isolationLevel: 'RepeatableRead' },
    )
  }

  create(actor: MaintenanceActor, tenantId: string, provider: MaintenanceProvider) {
    return prisma.$transaction((tx) => resolveMaintenanceProvider(tx, actor, tenantId, provider))
  }

  async update(actor: MaintenanceActor, providerId: string, changes: MaintenanceProviderChanges) {
    try {
      return await prisma.$transaction(async (tx) => {
        const current = await tx.prestadorManutencao.findFirst({
          where: { id: providerId, tenantId: actor.actorTenantId },
        })
        if (!current) throw new MaintenanceProviderNotFoundError()
        const value = {
          name: changes.name ?? current.nome,
          phone: changes.phone === undefined ? current.telefone : changes.phone,
          email: changes.email === undefined ? current.email : changes.email,
          notes: changes.notes === undefined ? current.observacoes : changes.notes,
        }
        const updated = await tx.prestadorManutencao.update({
          where: { id: providerId, tenantId: actor.actorTenantId, updatedAt: current.updatedAt },
          data: {
            nome: value.name,
            telefone: value.phone,
            email: value.email,
            observacoes: value.notes,
            ativo: changes.active,
            fingerprint: maintenanceProviderFingerprint(value),
            updatedById: actor.actorId,
            updatedAt: new Date(Math.max(Date.now(), current.updatedAt.getTime() + 1)),
          },
        })
        const previous = toMaintenanceProvider(current)
        const next = toMaintenanceProvider(updated)
        const fields = ['name', 'phone', 'email', 'notes', 'active'] as const
        const changed = fields.filter((field) => previous[field] !== next[field])
        await recordMaintenanceProviderAudit(
          tx,
          actor,
          updated.id,
          actor.actorTenantId,
          changes.active === false
            ? 'INACTIVATED'
            : changes.active === true && !current.ativo
              ? 'REACTIVATED'
              : 'UPDATED',
          changed,
        )
        return next
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') throw new MaintenanceProviderAlreadyExistsError()
        if (error.code === 'P2025')
          throw new ConflictError('O prestador foi alterado. Atualize a tela e tente novamente.')
      }
      throw error
    }
  }
}
