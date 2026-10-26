import { Prisma } from '@prisma/client'
import { prisma } from '@server/db/prisma'
import { ContactEmailAlreadyExistsError, CrmRecordNotFoundError } from '../domain/errors'
import type { CrmDatabase, CrmScope } from '../types/prisma'

export async function runCrmMutation<T>(
  scope: CrmScope,
  work: (db: CrmDatabase) => Promise<T>,
): Promise<T> {
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`crm:${scope.actorTenantId}`}, 0))`
      return work(tx)
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')
      throw new CrmRecordNotFoundError()
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      String(error.meta?.target).includes('email')
    )
      throw new ContactEmailAlreadyExistsError()
    throw error
  }
}
