import type { Prisma } from '@prisma/client'
import { prisma } from '@server/db/prisma'
import type { ContractOpportunityCatalog } from '../application/ports/contract-opportunity-catalog.port'
import type { ContractOpportunitiesQuery } from '../types/contract-opportunity'

export class PrismaContractOpportunityCatalog implements ContractOpportunityCatalog {
  list(query: ContractOpportunitiesQuery) {
    const search = query.search?.trim()
    const where: Prisma.OpportunityWhereInput = {
      tenantId: query.tenantId,
      status: 'ACCEPTED',
      archivedAt: null,
      contract: { is: null },
      ...(query.responsibleId ? { responsibleId: query.responsibleId } : {}),
      ...(search
        ? {
            OR: [
              { interestedName: { contains: search, mode: 'insensitive' } },
              { interestedEmail: { contains: search, mode: 'insensitive' } },
              { property: { title: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    }
    return prisma.$transaction(
      async (tx) => {
        const rows = await tx.opportunity.findMany({
          where,
          orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
          select: {
            id: true,
            interestedName: true,
            interestedEmail: true,
            interestedPhone: true,
            proposedValue: true,
            propertyId: true,
            property: {
              select: {
                title: true,
                address: { select: { street: true, neighborhood: true, city: true } },
                owner: {
                  select: { id: true, name: true, email: true, phone: true },
                },
              },
            },
          },
        })
        const totalCount = await tx.opportunity.count({ where })
        return {
          items: rows.map((row) => ({
            id: row.id,
            leadName: row.interestedName,
            leadEmail: row.interestedEmail,
            leadPhone: row.interestedPhone,
            proposedValue: row.proposedValue.toNumber(),
            propertyId: row.propertyId,
            propertyTitle: row.property.title,
            propertyAddress: row.property.address
              ? [
                  row.property.address.street,
                  row.property.address.neighborhood,
                  row.property.address.city,
                ]
                  .filter(Boolean)
                  .join(', ')
              : '',
            owner: row.property.owner
              ? {
                  id: row.property.owner.id,
                  name: row.property.owner.name,
                  email: row.property.owner.email,
                  phone: row.property.owner.phone,
                }
              : null,
          })),
          totalCount,
          page: query.page,
          pageSize: query.pageSize,
        }
      },
      { isolationLevel: 'RepeatableRead' },
    )
  }
}
