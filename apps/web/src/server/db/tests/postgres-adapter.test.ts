import { describe, expect, it, vi } from 'vitest'

import { serializeTransactionQueries } from '../postgres-adapter'

type Transaction = Parameters<typeof serializeTransactionQueries>[0]
const query = { sql: 'SELECT 1', args: [], argTypes: [] }
const rows: Awaited<ReturnType<Transaction['queryRaw']>> = {
  columnNames: ['value'],
  columnTypes: [0],
  rows: [[1]],
}

function createTransaction() {
  return {
    provider: 'postgres',
    adapterName: 'test',
    options: { usePhantomQuery: false },
    queryRaw: vi.fn<Transaction['queryRaw']>().mockResolvedValue(rows),
    executeRaw: vi.fn<Transaction['executeRaw']>().mockResolvedValue(1),
    commit: vi.fn<Transaction['commit']>().mockResolvedValue(undefined),
    rollback: vi.fn<Transaction['rollback']>().mockResolvedValue(undefined),
    createSavepoint: vi.fn().mockResolvedValue(undefined),
    rollbackToSavepoint: vi.fn().mockResolvedValue(undefined),
    releaseSavepoint: vi.fn().mockResolvedValue(undefined),
  } satisfies Transaction
}

describe('serializeTransactionQueries', () => {
  it.each(['commit', 'rollback'] as const)(
    'waits for queries, writes and savepoints before %s',
    async (finish) => {
      const transaction = createTransaction()
      const gate = Promise.withResolvers<typeof rows>()
      transaction.queryRaw.mockReturnValueOnce(gate.promise)
      const queued = serializeTransactionQueries(transaction)

      const operations = [
        queued.queryRaw(query),
        queued.executeRaw(query),
        queued.createSavepoint!('checkpoint'),
        queued.rollbackToSavepoint!('checkpoint'),
        queued.releaseSavepoint!('checkpoint'),
        queued[finish](),
      ]
      await Promise.resolve()

      expect(transaction.queryRaw).toHaveBeenCalledOnce()
      expect(transaction.executeRaw).not.toHaveBeenCalled()
      expect(transaction.createSavepoint).not.toHaveBeenCalled()
      expect(transaction[finish]).not.toHaveBeenCalled()

      gate.resolve(rows)
      await expect(Promise.all(operations)).resolves.toEqual([
        rows,
        1,
        undefined,
        undefined,
        undefined,
        undefined,
      ])
      const calls = [
        transaction.queryRaw,
        transaction.executeRaw,
        transaction.createSavepoint,
        transaction.rollbackToSavepoint,
        transaction.releaseSavepoint,
        transaction[finish],
      ].map((method) => method.mock.invocationCallOrder[0])
      expect(calls).toEqual([...calls].sort((a, b) => a - b))
      expect(transaction.createSavepoint).toHaveBeenCalledWith('checkpoint')
      expect(transaction.rollbackToSavepoint).toHaveBeenCalledWith('checkpoint')
      expect(transaction.releaseSavepoint).toHaveBeenCalledWith('checkpoint')
    },
  )

  it('preserves a failed query and still runs rollback', async () => {
    const transaction = createTransaction()
    const error = new Error('query failed')
    transaction.queryRaw.mockRejectedValueOnce(error)
    const queued = serializeTransactionQueries(transaction)

    const failed = queued.queryRaw(query)
    const rollback = queued.rollback()

    await expect(failed).rejects.toBe(error)
    await expect(rollback).resolves.toBeUndefined()
    expect(transaction.rollback).toHaveBeenCalledOnce()
  })

  it('keeps separate transaction connections concurrent', async () => {
    const first = createTransaction()
    const second = createTransaction()
    const gate = Promise.withResolvers<typeof rows>()
    first.queryRaw.mockReturnValueOnce(gate.promise)
    second.queryRaw.mockReturnValueOnce(gate.promise)

    const operations = [
      serializeTransactionQueries(first).queryRaw(query),
      serializeTransactionQueries(second).queryRaw(query),
    ]
    await Promise.resolve()

    try {
      expect(first.queryRaw).toHaveBeenCalledOnce()
      expect(second.queryRaw).toHaveBeenCalledOnce()
    } finally {
      gate.resolve(rows)
      await Promise.all(operations)
    }
  })
})
