import type { Prisma } from '@prisma/client'
import { prisma } from '@server/db/prisma'
import type { ContractOpportunityCatalog } from '../application/ports/contract-opportunity-catalog.port'
import type { ContractOpportunitiesQuery } from '../types/contract-opportunity'

export class PrismaContractOpportunityCatalog implements ContractOpportunityCatalog {
  list(query: ContractOpportunitiesQuery) {
    const search = query.search?.trim()
    const where: Prisma.OportunidadeWhereInput = {
      tenantId: query.tenantId,
      status: 'ACEITA',
      arquivadaEm: null,
      contrato: { is: null },
      ...(query.responsibleId ? { imovel: { responsavelId: query.responsibleId } } : {}),
      ...(search
        ? {
            OR: [
              { interessadoNome: { contains: search, mode: 'insensitive' } },
              { interessadoEmail: { contains: search, mode: 'insensitive' } },
              { imovel: { titulo: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    }
    return prisma.$transaction(
      async (tx) => {
        const rows = await tx.oportunidade.findMany({
          where,
          orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
          select: {
            id: true,
            interessadoNome: true,
            interessadoEmail: true,
            interessadoTelefone: true,
            valorProposto: true,
            imovelId: true,
            imovel: {
              select: {
                titulo: true,
                endereco: { select: { logradouro: true, bairro: true, cidade: true } },
                proprietario: {
                  select: { id: true, nome: true, email: true, telefone: true },
                },
              },
            },
          },
        })
        const totalCount = await tx.oportunidade.count({ where })
        return {
          items: rows.map((row) => ({
            id: row.id,
            leadName: row.interessadoNome,
            leadEmail: row.interessadoEmail,
            leadPhone: row.interessadoTelefone,
            proposedValue: row.valorProposto.toNumber(),
            propertyId: row.imovelId,
            propertyTitle: row.imovel.titulo,
            propertyAddress: row.imovel.endereco
              ? [
                  row.imovel.endereco.logradouro,
                  row.imovel.endereco.bairro,
                  row.imovel.endereco.cidade,
                ]
                  .filter(Boolean)
                  .join(', ')
              : '',
            owner: row.imovel.proprietario
              ? {
                  id: row.imovel.proprietario.id,
                  name: row.imovel.proprietario.nome,
                  email: row.imovel.proprietario.email,
                  phone: row.imovel.proprietario.telefone,
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
