import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@server/db/prisma', () => ({
  prisma: { charge: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn() } },
}))

import { prisma } from '@server/db/prisma'
import { PrismaChargeRepository } from '../../infrastructure/prisma-charge.repository'

const renterScope = { kind: 'renter', userId: 'renter-1' } as const
const today = new Date('2026-10-26T00:00:00.000Z')
const renterRestriction = {
  type: 'RECEIVABLE',
  contract: {
    parties: {
      some: {
        role: 'RENTER',
        userId: 'renter-1',
        user: { active: true, role: 'RENTER' },
      },
    },
  },
}

describe('PrismaChargeRepository read authorization', () => {
  beforeEach(() => {
    vi.mocked(prisma.charge.findMany).mockResolvedValue([])
    vi.mocked(prisma.charge.count).mockResolvedValue(0)
    vi.mocked(prisma.charge.findFirst).mockResolvedValue(null)
    vi.clearAllMocks()
  })

  it('applies the same renter restriction to search results and pagination totals', async () => {
    await new PrismaChargeRepository().findMany({
      scope: renterScope,
      today,
      search: 'Maria',
      page: 2,
      pageSize: 5,
    })
    const listQuery = vi.mocked(prisma.charge.findMany).mock.calls[0][0]!
    const countQueries = vi.mocked(prisma.charge.count).mock.calls.map((call) => call[0]!)
    expect(countQueries).toHaveLength(7)
    expect(countQueries[0].where).toEqual(listQuery.where)
    for (const count of countQueries) {
      expect((count.where?.AND as object[]).slice(0, 2)).toEqual(
        (listQuery.where?.AND as object[]).slice(0, 2),
      )
    }
    const and = listQuery.where?.AND as object[]
    expect(and[0]).toEqual(renterRestriction)
    expect((and[1] as { OR: unknown[] }).OR).toHaveLength(4)
    expect(listQuery).toMatchObject({ skip: 5, take: 5 })
  })

  it('keeps the renter restriction when accounts payable are requested directly on the port', async () => {
    await new PrismaChargeRepository().findMany({ scope: renterScope, today, type: 'PAYABLE' })
    const and = vi.mocked(prisma.charge.findMany).mock.calls[0][0]!.where?.AND as object[]
    expect(and).toContainEqual(renterRestriction)
    expect(and).toContainEqual({ type: 'PAYABLE' })
  })

  it('checks the user link and receivable type when reading a charge by ID', async () => {
    await new PrismaChargeRepository().findReadableById(renterScope, 'charge-1')
    expect(prisma.charge.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ...renterRestriction, id: 'charge-1' },
      }),
    )
  })

  it('keeps agency staff reads inside their tenant', async () => {
    const repository = new PrismaChargeRepository()
    await repository.findMany({ scope: { kind: 'tenant', tenantId: 'agency-1' }, today })
    await repository.findById('agency-1', 'charge-1')
    expect(prisma.charge.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ AND: expect.arrayContaining([{ tenantId: 'agency-1' }]) }),
      }),
    )
    expect(prisma.charge.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'agency-1', id: 'charge-1' },
      }),
    )
  })

  it.each([
    ['OVERDUE', { status: { in: ['PENDING', 'SCHEDULED'] }, dueDate: { lt: today } }],
    ['PENDING', { status: 'PENDING', dueDate: { gte: today } }],
    ['SCHEDULED', { status: 'SCHEDULED', dueDate: { gte: today } }],
    ['PAID', { status: 'PAID' }],
  ] as const)('traduz o filtro %s para a regra de atraso pela data', async (status, where) => {
    await new PrismaChargeRepository().findMany({
      scope: { kind: 'tenant', tenantId: 'agency-1' },
      today,
      status,
    })
    const and = vi.mocked(prisma.charge.findMany).mock.calls[0][0]!.where?.AND as object[]
    expect(and).toContainEqual(where)
  })
})
