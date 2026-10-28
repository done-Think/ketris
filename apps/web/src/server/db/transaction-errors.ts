import { Prisma } from '@prisma/client'

// Prisma's pg adapter reports serialization failures from raw locking queries
// as P2010, while ORM writes can surface the same SQLSTATE as P2034.
export function isTransactionWriteConflict(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false
  if (error.code === 'P2034') return true
  if (error.code !== 'P2010') return false
  const metadata = error.meta as
    | { code?: string; driverAdapterError?: { cause?: { kind?: string; originalCode?: string } } }
    | undefined
  const cause = metadata?.driverAdapterError?.cause
  return (
    metadata?.code === '40001' ||
    metadata?.code === '40P01' ||
    cause?.kind === 'TransactionWriteConflict' ||
    cause?.originalCode === '40001' ||
    cause?.originalCode === '40P01'
  )
}
