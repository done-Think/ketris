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
      const totalCount = await tx.contrato.count({ where: query.where })
      const ids = await tx.$queryRaw<ContractIdRow[]>(Prisma.sql`
      SELECT c.id FROM contratos c JOIN imoveis i ON i.id = c."imovelId"
      WHERE ${query.sql} ORDER BY ${order} ${direction} NULLS LAST, c.id ASC
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
    `)
      const contracts = await tx.contrato.findMany({
        where: { AND: [query.where, { id: { in: ids.map((row) => row.id) } }] },
        include: {
          imovel: {
            select: {
              titulo: true,
              endereco: { select: { logradouro: true, bairro: true, cidade: true } },
            },
          },
          partes: { select: { papel: true, nome: true, assinatura: { select: { status: true } } } },
        },
      })
      const rowsById = new Map(contracts.map((contract) => [contract.id, contract]))
      const where = contractReadWhere(scope)
      const dates = contractPeriodDates()
      const summary = {
        total: await tx.contrato.count({ where }),
        active: await tx.contrato.count({ where: { AND: [where, { status: 'ATIVO' }] } }),
        expiring30: await tx.contrato.count({
          where: { AND: [where, { dataFim: { gte: dates.today, lt: dates.after30 } }] },
        }),
        expiring90: await tx.contrato.count({
          where: { AND: [where, { dataFim: { gte: dates.today, lt: dates.after90 } }] },
        }),
        closed: await tx.contrato.count({ where: { AND: [where, { status: 'ENCERRADO' }] } }),
      }
      const items = ids.flatMap(({ id }) => {
        const contract = rowsById.get(id)
        if (!contract) return []
        const address = contract.imovel.endereco
        return [
          {
            canEdit:
              scope.kind === 'tenant' &&
              ['RASCUNHO', 'EM_REVISAO', 'AGUARDANDO_ASSINATURA'].includes(contract.status) &&
              !contract.partes.some((party) => party.assinatura?.status === 'ASSINADA'),
            id: contract.id,
            code: contract.codigo,
            opportunityId: contract.oportunidadeOrigemId,
            propertyId: contract.imovelId,
            propertyTitle: contract.imovel.titulo,
            propertyAddress: address
              ? [address.logradouro, address.bairro, address.cidade].filter(Boolean).join(', ')
              : '',
            ownerName: contract.partes.find((party) => party.papel === 'LOCADOR')?.nome ?? null,
            tenantName: contract.partes.find((party) => party.papel === 'LOCATARIO')?.nome ?? null,
            status: contract.status,
            type: contract.tipo,
            amount: contract.valor.toNumber(),
            startDate: contract.dataInicio,
            endDate: contract.dataFim,
            updatedAt: contract.updatedAt,
          },
        ]
      })
      return { items, totalCount, summary }
    },
    { isolationLevel: 'RepeatableRead' },
  )
}
