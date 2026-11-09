import { Prisma } from '@prisma/client'

/**
 * Describes which constraint a unique violation hit. Prisma reports it as `meta.target` on the
 * native engine and under `meta.driverAdapterError` with the pg adapter, so both are searched.
 */
export function uniqueViolation(error: unknown): string | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002')
    return null
  return JSON.stringify(error.meta ?? {})
}
