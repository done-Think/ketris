import type { Prisma } from '@prisma/client'

export type PrismaUserRecord = Prisma.UsuarioGetPayload<{
  include: { tenant: { select: { status: true; nome: true; slug: true } } }
}>
