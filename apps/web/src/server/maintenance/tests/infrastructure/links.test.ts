// @vitest-environment node
import { Prisma } from '@prisma/client'
import { prisma } from '@server/db/prisma'
import { ConflictError, ForbiddenError } from '@server/shared/errors'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { regularizeMaintenanceLinks } from '../../infrastructure/prisma-maintenance-links'
import { admin, renter } from '../fixtures/maintenance-ticket'

vi.mock('@server/db/prisma', () => ({ prisma: { $transaction: vi.fn() } }))

const input = { contractId: 'contract-1', ownerId: 'owner' }
const linkParty = vi.fn().mockResolvedValue(undefined)

function serializationFailure() {
  return new Prisma.PrismaClientKnownRequestError('serialization failure', {
    code: 'P2034',
    clientVersion: 'test',
  })
}

describe('Maintenance link regularization transaction', () => {
  beforeEach(() => vi.resetAllMocks())

  it('retries a serialization conflict and succeeds', async () => {
    vi.mocked(prisma.$transaction)
      .mockRejectedValueOnce(serializationFailure())
      .mockResolvedValueOnce(undefined)
    await expect(regularizeMaintenanceLinks(admin, input, linkParty)).resolves.toBeUndefined()
    expect(prisma.$transaction).toHaveBeenCalledTimes(2)
    expect(prisma.$transaction).toHaveBeenLastCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    })
  })

  it('reports a conflict after three failed attempts', async () => {
    vi.mocked(prisma.$transaction).mockRejectedValue(serializationFailure())
    await expect(regularizeMaintenanceLinks(admin, input, linkParty)).rejects.toBeInstanceOf(
      ConflictError,
    )
    expect(prisma.$transaction).toHaveBeenCalledTimes(3)
  })

  it('does not retry other failures', async () => {
    const failure = new Error('boom')
    vi.mocked(prisma.$transaction).mockRejectedValue(failure)
    await expect(regularizeMaintenanceLinks(admin, input, linkParty)).rejects.toBe(failure)
    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
  })

  it('rejects unauthorized actors before opening a transaction', async () => {
    await expect(regularizeMaintenanceLinks(renter, input, linkParty)).rejects.toBeInstanceOf(
      ForbiddenError,
    )
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})
