import type { Prisma } from '@prisma/client'
const linkedUserSelect = { id: true, name: true, email: true } as const

export const agendaEventInclude = {
  createdBy: { select: { name: true, role: true } },
  responsible: { select: { name: true } },
  ownerUser: { select: linkedUserSelect },
  participants: {
    select: { user: { select: linkedUserSelect } },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.AgendaEventInclude
