// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '@prisma/client'
import { prisma } from '@server/db/prisma'
import { ConflictError } from '@server/shared/errors'
import { regularizeMaintenanceLinks } from '../../infrastructure/prisma-maintenance-links'
import { admin } from '../fixtures/maintenance-ticket'

vi.mock('@server/db/prisma', () => ({ prisma: { $transaction: vi.fn() } }))

const input = { contractId: 'contract-1', ownerId: 'owner' }
const linker = () => ({ execute: vi.fn() })

function serializationFailure() {
  return new Prisma.PrismaClientKnownRequestError('serialization failure', {
    code: 'P2034',
    clientVersion: 'test',
  })
}

describe('Maintenance link regularization transaction', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retries a false serialization conflict and succeeds', async () => {
    vi.mocked(prisma.$transaction)
      .mockRejectedValueOnce(serializationFailure())
      .mockResolvedValueOnce(undefined)
    await expect(regularizeMaintenanceLinks(admin, input, linker)).resolves.toBeUndefined()
    expect(prisma.$transaction).toHaveBeenCalledTimes(2)
  })

  it('reports a conflict only after every attempt fails', async () => {
    vi.mocked(prisma.$transaction).mockRejectedValue(serializationFailure())
    await expect(regularizeMaintenanceLinks(admin, input, linker)).rejects.toBeInstanceOf(
      ConflictError,
    )
    expect(prisma.$transaction).toHaveBeenCalledTimes(3)
  })

  it('does not retry other failures', async () => {
    const failure = new Error('boom')
    vi.mocked(prisma.$transaction).mockRejectedValue(failure)
    await expect(regularizeMaintenanceLinks(admin, input, linker)).rejects.toBe(failure)
    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
  })
})
