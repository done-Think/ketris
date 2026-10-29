import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@server/db/prisma'
import { PrismaContractRepository } from '../../infrastructure/prisma-contract.repository'

vi.mock('@server/db/prisma', () => {
  const tx = {
    contract: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn() },
    $queryRaw: vi.fn().mockResolvedValue([]),
  }
  return {
    prisma: {
      ...tx,
      $transaction: vi.fn(async (work: (client: typeof tx) => Promise<unknown>) => work(tx)),
    },
  }
})

const partyScope = { kind: 'party', userId: 'renter-1' } as const
const partyRestriction = {
  parties: {
    some: {
      role: 'RENTER',
      userId: 'renter-1',
      user: { active: true, role: 'RENTER' },
    },
  },
}

describe('PrismaContractRepository read authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.contract.findMany).mockResolvedValue([])
    vi.mocked(prisma.contract.count).mockResolvedValue(0)
    vi.mocked(prisma.contract.findFirst).mockResolvedValue(null)
  })

  it('applies the same renter restriction to search results and pagination totals', async () => {
    await new PrismaContractRepository().findMany(
      { search: 'Jardins', page: 2, pageSize: 5 },
      partyScope,
    )
    const listQuery = vi.mocked(prisma.contract.findMany).mock.calls[0][0]!
    const countQuery = vi.mocked(prisma.contract.count).mock.calls[0][0]!
    expect(listQuery.where).toMatchObject({ AND: [countQuery.where, { id: { in: [] } }] })
    expect(countQuery.where).toMatchObject({ AND: [partyRestriction] })
    expect(listQuery.where).not.toHaveProperty('tenantId')
    expect(countQuery.where?.OR).toHaveLength(3)
    const sql = vi.mocked(prisma.$queryRaw).mock.calls[0][0]
    expect(sql).toMatchObject({ values: expect.arrayContaining(['renter-1', 5]) })
  })

  it('reads a contract by ID only through the renter link, in any tenant', async () => {
    await new PrismaContractRepository().findById('contract-1', partyScope)
    expect(prisma.contract.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'contract-1', ...partyRestriction } }),
    )
  })

  it('keeps agency staff reads inside their tenant and the AGENT inside its properties and opportunities', async () => {
    const repository = new PrismaContractRepository()
    await repository.findMany({}, { kind: 'tenant', tenantId: 'agency-1' })
    await repository.findById('contract-1', {
      kind: 'tenant',
      tenantId: 'agency-1',
      responsibleId: 'agent-1',
    })
    expect(prisma.contract.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: [expect.objectContaining({ AND: [{ tenantId: 'agency-1' }] }), { id: { in: [] } }],
        }),
      }),
    )
    expect(prisma.contract.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'contract-1',
          tenantId: 'agency-1',
          OR: [
            { property: { responsibleId: 'agent-1' } },
            { sourceOpportunity: { responsibleId: 'agent-1' } },
          ],
        },
      }),
    )
  })
})
