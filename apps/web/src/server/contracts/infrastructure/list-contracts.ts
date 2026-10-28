import type { ContractIdRow } from '../types/prisma-contract-repository'
import { Prisma } from '@prisma/client'
import { prisma } from '@server/db/prisma'
import type { ContractListFilters, ContractReadScope } from '../types/contract-entity'
import { contractListQuery } from './contract-list-query'
import { contractReadWhere } from './contract-query'
import { contractDisplayOrder } from './contract-display-order'
import { contractPeriodDates } from './contract-period'

export function listContracts(filters: ContractListFilters, scope: ContractReadScope) {
  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? 10
  const query = contractListQuery(filters, scope)
  const order = contractDisplayOrder(filters)
  const direction = filters.sortOrder === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`
  return prisma.$transaction(
    async (tx) => {
      const totalCount = await tx.contract.count({ where: query.where })
      const ids = await tx.$queryRaw<ContractIdRow[]>(Prisma.sql`
      SELECT c.id FROM contracts c JOIN properties i ON i.id = c."propertyId"
      WHERE ${query.sql} ORDER BY ${order} ${direction} NULLS LAST, c.id ASC
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
    `)
      const contracts = await tx.contract.findMany({
        where: { AND: [query.where, { id: { in: ids.map((row) => row.id) } }] },
        include: {
          property: {
            select: {
              title: true,
              address: { select: { street: true, neighborhood: true, city: true } },
            },
          },
          parties: { select: { role: true, name: true, signature: { select: { status: true } } } },
        },
      })
      const rowsById = new Map(contracts.map((contract) => [contract.id, contract]))
      const where = contractReadWhere(scope)
      const dates = contractPeriodDates()
      const summary = {
        total: await tx.contract.count({ where }),
        active: await tx.contract.count({ where: { AND: [where, { status: 'ACTIVE' }] } }),
        expiring30: await tx.contract.count({
          where: { AND: [where, { endDate: { gte: dates.today, lt: dates.after30 } }] },
        }),
        expiring90: await tx.contract.count({
          where: { AND: [where, { endDate: { gte: dates.today, lt: dates.after90 } }] },
        }),
        closed: await tx.contract.count({ where: { AND: [where, { status: 'CLOSED' }] } }),
      }
      const items = ids.flatMap(({ id }) => {
        const contract = rowsById.get(id)
        if (!contract) return []
        const address = contract.property.address
        return [
          {
            canEdit:
              scope.kind === 'tenant' &&
              ['DRAFT', 'IN_REVIEW', 'AWAITING_SIGNATURE'].includes(contract.status) &&
              !contract.parties.some((party) => party.signature?.status === 'SIGNED'),
            id: contract.id,
            code: contract.code,
            opportunityId: contract.sourceOpportunityId,
            propertyId: contract.propertyId,
            propertyTitle: contract.property.title,
            propertyAddress: address
              ? [address.street, address.neighborhood, address.city].filter(Boolean).join(', ')
              : '',
            ownerName: contract.parties.find((party) => party.role === 'LANDLORD')?.name ?? null,
            tenantName: contract.parties.find((party) => party.role === 'RENTER')?.name ?? null,
            status: contract.status,
            type: contract.type,
            amount: contract.amount.toNumber(),
            startDate: contract.startDate,
            endDate: contract.endDate,
            updatedAt: contract.updatedAt,
          },
        ]
      })
      return { items, totalCount, summary }
    },
    { isolationLevel: 'RepeatableRead' },
  )
}
