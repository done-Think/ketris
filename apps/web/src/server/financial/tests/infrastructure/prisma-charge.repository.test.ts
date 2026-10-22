import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@server/db/prisma', () => ({
  prisma: { cobranca: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn() } },
}))

import { prisma } from '@server/db/prisma'
import { PrismaChargeRepository } from '../../infrastructure/prisma-charge.repository'

const renterScope = { kind: 'renter', userId: 'renter-1' } as const
const renterRestriction = {
  tipo: 'A_RECEBER',
  contrato: {
    partes: {
      some: {
        papel: 'LOCATARIO',
        usuarioId: 'renter-1',
        usuario: { ativo: true, papel: 'RENTER' },
      },
    },
  },
}

describe('PrismaChargeRepository read authorization', () => {
  beforeEach(() => {
    vi.mocked(prisma.cobranca.findMany).mockResolvedValue([])
    vi.mocked(prisma.cobranca.count).mockResolvedValue(0)
    vi.mocked(prisma.cobranca.findFirst).mockResolvedValue(null)
    vi.clearAllMocks()
  })

  it('applies the same renter restriction to search results and pagination totals', async () => {
    await new PrismaChargeRepository().findMany({
      scope: renterScope,
      search: 'Maria',
      page: 2,
      pageSize: 5,
    })
    const listQuery = vi.mocked(prisma.cobranca.findMany).mock.calls[0][0]!
    const countQuery = vi.mocked(prisma.cobranca.count).mock.calls[0][0]!
    expect(listQuery.where).toEqual(countQuery.where)
    expect(listQuery.where).toMatchObject({ AND: [renterRestriction] })
    expect(listQuery.where?.OR).toHaveLength(4)
    expect(listQuery).toMatchObject({ skip: 5, take: 5 })
  })

  it('keeps the renter restriction when accounts payable are requested directly on the port', async () => {
    await new PrismaChargeRepository().findMany({ scope: renterScope, type: 'A_PAGAR' })
    expect(prisma.cobranca.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ AND: [renterRestriction], tipo: 'A_PAGAR' }),
      }),
    )
  })

  it('checks the user link and receivable type when reading a charge by ID', async () => {
    await new PrismaChargeRepository().findReadableById(renterScope, 'charge-1')
    expect(prisma.cobranca.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ...renterRestriction, id: 'charge-1' },
      }),
    )
  })

  it('keeps agency staff reads inside their tenant', async () => {
    const repository = new PrismaChargeRepository()
    await repository.findMany({ scope: { kind: 'tenant', tenantId: 'agency-1' } })
    await repository.findById('agency-1', 'charge-1')
    expect(prisma.cobranca.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ AND: [{ tenantId: 'agency-1' }] }),
      }),
    )
    expect(prisma.cobranca.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'agency-1', id: 'charge-1' },
      }),
    )
  })
})
