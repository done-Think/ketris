import { expect, it } from 'vitest'
import type { AgendaEvent } from '../../domain/agenda-event.entity'
import {
  toAgendaEventReadResponse,
  toAgendaEventResponse,
} from '../../application/agenda-event-response'

const event: AgendaEvent = {
  id: 'event',
  tenantId: 'agency',
  responsibleId: 'agent',
  responsibleName: 'Corretora',
  createdById: 'manager',
  createdBy: { name: 'Marina', role: 'OWNER' },
  ownerUserId: 'renter',
  dono: { id: 'renter', name: 'Locatário', email: 'renter@example.test' },
  participants: [],
  propertyId: 'property',
  freeFormPropertyReference: null,
  propertyLabel: null,
  title: 'Vistoria',
  type: 'INSPECTION',
  audience: 'SHARED_TEAM',
  internal: false,
  status: 'CANCELLED',
  start: new Date('2031-03-01T15:00:00Z'),
  end: new Date('2031-03-01T16:00:00Z'),
  participantName: 'Contato privado',
  participantPhone: '11999999999',
  notes: 'Nota privada',
  canceledById: 'manager',
  canceledAt: new Date(),
  cancellationReason: 'Motivo privado',
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
