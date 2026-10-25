import { expect, it } from 'vitest'
import type { AgendaEvent } from '../../domain/agenda-event.entity'
import {
  toAgendaEventReadResponse,
  toAgendaEventResponse,
} from '../../application/agenda-event-response'

const event: AgendaEvent = {
  id: 'event',
  tenantId: 'agency',
  responsavelId: 'agent',
  responsavelNome: 'Corretora',
  criadoPorId: 'manager',
  criadoPor: { nome: 'Marina', papel: 'OWNER' },
  donoUsuarioId: 'renter',
  dono: { id: 'renter', nome: 'Locatário', email: 'renter@example.test' },
  participantes: [],
  imovelId: 'property',
  referenciaImovelLivre: null,
  propertyLabel: null,
  titulo: 'Vistoria',
  tipo: 'INSPECTION',
  destino: 'SHARED_TEAM',
  interno: false,
  status: 'CANCELLED',
  inicio: new Date('2031-03-01T15:00:00Z'),
  fim: new Date('2031-03-01T16:00:00Z'),
  participanteNome: 'Contato privado',
  participanteTelefone: '11999999999',
  notas: 'Nota privada',
  canceladoPorId: 'manager',
  canceladoEm: new Date(),
  motivoCancelamento: 'Motivo privado',
  createdAt: new Date(),
  updatedAt: new Date(),
}
it('integra nome e papel reais do criador na visão completa', () => {
  expect(toAgendaEventResponse(event)).toMatchObject({
    createdById: 'manager',
    createdBy: { name: 'Marina', role: 'OWNER' },
    cancellationReason: 'Motivo privado',
  })
})
it('mantém a visão reduzida sem criador, contato, notas ou motivo de terceiros', () => {
  const response = toAgendaEventReadResponse(event, 'RENTER', 'renter')
  expect(response).not.toHaveProperty('createdBy')
  expect(response).not.toHaveProperty('createdById')
  expect(response).not.toHaveProperty('participantPhone')
  expect(response).not.toHaveProperty('notes')
  expect(response).not.toHaveProperty('cancellationReason')
  expect(response).not.toHaveProperty('tenantId')
})
