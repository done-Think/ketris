import type { Prisma } from '@prisma/client'
const linkedUserSelect = { id: true, nome: true, email: true } as const

export const agendaEventInclude = {
  criadoPor: { select: { nome: true, papel: true } },
  responsavel: { select: { nome: true } },
  donoUsuario: { select: linkedUserSelect },
  participantes: {
    select: { usuario: { select: linkedUserSelect } },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.EventoAgendaInclude
