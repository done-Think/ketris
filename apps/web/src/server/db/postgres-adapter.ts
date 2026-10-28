import { PrismaPg } from '@prisma/adapter-pg'

type PgConnection = Awaited<ReturnType<PrismaPg['connect']>>
type PgTransaction = Awaited<ReturnType<PgConnection['startTransaction']>>

export function serializeTransactionQueries(transaction: PgTransaction): PgTransaction {
  let pending: Promise<void> = Promise.resolve()

  function enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = pending.then(operation)
    // Keep rollback available after a query fails, while preserving the caller's error.
    pending = result.then(
      () => undefined,
      () => undefined,
    )
    return result
  }

  const createSavepoint = transaction.createSavepoint?.bind(transaction)
  const rollbackToSavepoint = transaction.rollbackToSavepoint?.bind(transaction)
  const releaseSavepoint = transaction.releaseSavepoint?.bind(transaction)

  return {
    provider: transaction.provider,
    adapterName: transaction.adapterName,
    options: transaction.options,
    queryRaw: (query) => enqueue(() => transaction.queryRaw(query)),
    executeRaw: (query) => enqueue(() => transaction.executeRaw(query)),
    commit: () => enqueue(() => transaction.commit()),
    rollback: () => enqueue(() => transaction.rollback()),
    ...(createSavepoint && {
      createSavepoint: (name: string) => enqueue(() => createSavepoint(name)),
    }),
    ...(rollbackToSavepoint && {
      rollbackToSavepoint: (name: string) => enqueue(() => rollbackToSavepoint(name)),
    }),
    ...(releaseSavepoint && {
      releaseSavepoint: (name: string) => enqueue(() => releaseSavepoint(name)),
    }),
  }
}

export function createPostgresAdapter(
  config: ConstructorParameters<typeof PrismaPg>[0],
  options?: ConstructorParameters<typeof PrismaPg>[1],
) {
  const factory = new PrismaPg(config, options)
  const connect = factory.connect.bind(factory)

  factory.connect = async () => {
    const connection = await connect()
    const startTransaction = connection.startTransaction.bind(connection)

    // Prisma 7.9 can dispatch relation queries concurrently on one pg.Client.
    // Serialize only that transaction; independent pool connections remain concurrent.
    // Upstream: https://github.com/prisma/orm/issues/29407
    connection.startTransaction = async (isolationLevel) =>
      serializeTransactionQueries(await startTransaction(isolationLevel))

    return connection
  }

  return factory
}
