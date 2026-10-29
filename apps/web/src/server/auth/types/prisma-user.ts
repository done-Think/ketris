import type { Prisma } from '@prisma/client'

export type PrismaUserRecord = Prisma.UserGetPayload<{
  include: { tenant: { select: { status: true; name: true; slug: true } } }
}>
