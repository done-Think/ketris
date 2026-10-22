import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@server/db/prisma', () => ({
  prisma: { contrato: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn() } },
}))

import { prisma } from '@server/db/prisma'
import { PrismaContractRepository } from '../../infrastructure/prisma-contract.repository'

const partyScope = { kind: 'party', userId: 'renter-1' } as const
const partyRestriction = {
  partes: {
    some: {
      papel: 'LOCATARIO',
      usuarioId: 'renter-1',
      usuario: { ativo: true, papel: 'RENTER' },
    },
  },
}

describe('PrismaContractRepository read authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.contrato.findMany).mockResolvedValue([])
    vi.mocked(prisma.contrato.count).mockResolvedValue(0)
    vi.mocked(prisma.contrato.findFirst).mockResolvedValue(null)
  })

  it('applies the same renter restriction to search results and pagination totals', async () => {
    await new PrismaContractRepository().findMany(
      { search: 'Jardins', page: 2, pageSize: 5 },
      partyScope,
    )
    const listQuery = vi.mocked(prisma.contrato.findMany).mock.calls[0][0]!
    const countQuery = vi.mocked(prisma.contrato.count).mock.calls[0][0]!
    expect(listQuery.where).toEqual(countQuery.where)
    expect(listQuery.where).toMatchObject({ AND: [partyRestriction] })
    expect(listQuery.where).not.toHaveProperty('tenantId')
    expect(listQuery.where?.OR).toHaveLength(3)
    expect(listQuery).toMatchObject({ skip: 5, take: 5 })
  })

  it('reads a contract by ID only through the renter link, in any tenant', async () => {
    await new PrismaContractRepository().findById('contract-1', partyScope)
    expect(prisma.contrato.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'contract-1', ...partyRestriction } }),
    )
  })

  it('keeps agency staff reads inside their tenant and the AGENT inside its properties', async () => {
    const repository = new PrismaContractRepository()
    await repository.findMany({}, { kind: 'tenant', tenantId: 'agency-1' })
    await repository.findById('contract-1', {
      kind: 'tenant',
      tenantId: 'agency-1',
      responsibleId: 'agent-1',
    })
    expect(prisma.contrato.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ AND: [{ tenantId: 'agency-1' }] }),
      }),
    )
    expect(prisma.contrato.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'contract-1',
          tenantId: 'agency-1',
          imovel: { responsavelId: 'agent-1' },
        },
      }),
    )
  })
})
