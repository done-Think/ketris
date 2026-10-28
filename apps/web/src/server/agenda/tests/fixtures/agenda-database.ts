import { randomUUID } from 'node:crypto'
import { prisma } from '@server/db/prisma'

export async function createAgendaFixture() {
  const suffix = randomUUID()
  const tenant = await prisma.tenant.create({
    data: { name: 'Agenda teste', slug: `agenda-${suffix}` },
  })
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Responsável Agenda',
      email: `${suffix}@agenda.example.test`,
      passwordHash: 'test-only',
      role: 'OWNER',
    },
  })
  return { tenantId: tenant.id, userId: user.id }
}

export function agendaFixtureEvent(tenantId: string, userId: string) {
  return {
    tenantId,
    responsibleId: userId,
    createdById: userId,
    title: 'Reunião de teste',
    audience: 'SHARED_TEAM' as const,
    internal: false,
    type: 'MEETING' as const,
    start: new Date('2031-03-01T15:00:00Z'),
    end: new Date('2031-03-01T16:00:00Z'),
    participantName: 'Cliente teste',
    participantPhone: '11999999999',
    freeFormPropertyReference: 'Imóvel de teste',
  }
}
