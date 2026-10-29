import { Prisma } from '@prisma/client'
import { describe, expect, it } from 'vitest'
import { isTransactionWriteConflict } from '../transaction-errors'

const failure = (code: string, meta?: Record<string, unknown>) =>
  new Prisma.PrismaClientKnownRequestError('Fixture database failure', {
    code,
    clientVersion: 'test',
    meta,
  })

describe('transaction write conflict classification', () => {
  it('handles ORM serialization errors and raw pg adapter locking errors', () => {
    expect(isTransactionWriteConflict(failure('P2034'))).toBe(true)
    expect(isTransactionWriteConflict(failure('P2010', { code: '40001' }))).toBe(true)
    expect(isTransactionWriteConflict(failure('P2010', { code: '40P01' }))).toBe(true)
    expect(
      isTransactionWriteConflict(
        failure('P2010', {
          driverAdapterError: {
            cause: { kind: 'TransactionWriteConflict', originalCode: '40001' },
          },
        }),
      ),
    ).toBe(true)
  })
  it('does not retry integrity failures or unknown application errors', () => {
    expect(isTransactionWriteConflict(failure('P2003'))).toBe(false)
    expect(isTransactionWriteConflict(failure('P2010', { code: '23503' }))).toBe(false)
    expect(isTransactionWriteConflict(new Error('Application failure'))).toBe(false)
    expect(isTransactionWriteConflict(null)).toBe(false)
  })
})
