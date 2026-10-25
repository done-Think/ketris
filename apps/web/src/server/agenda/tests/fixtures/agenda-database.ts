import { randomUUID } from 'node:crypto'
import { prisma } from '@server/db/prisma'

export async function createAgendaFixture() {
  const suffix = randomUUID()
  const tenant = await prisma.tenant.create({
    data: { nome: 'Agenda teste', slug: `agenda-${suffix}` },
  })
  const user = await prisma.usuario.create({
    data: {
      tenantId: tenant.id,
      nome: 'Responsável Agenda',
      email: `${suffix}@agenda.example.test`,
      senhaHash: 'test-only',
      papel: 'OWNER',
    },
  })
  return { tenantId: tenant.id, userId: user.id }
}

export function agendaFixtureEvent(tenantId: string, userId: string) {
  return {
    tenantId,
    responsavelId: userId,
    criadoPorId: userId,
    titulo: 'Reunião de teste',
    destino: 'SHARED_TEAM' as const,
    interno: false,
    tipo: 'MEETING' as const,
    inicio: new Date('2031-03-01T15:00:00Z'),
    fim: new Date('2031-03-01T16:00:00Z'),
    participanteNome: 'Cliente teste',
    participanteTelefone: '11999999999',
    referenciaImovelLivre: 'Imóvel de teste',
  }
}
