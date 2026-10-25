import { expect, it } from 'vitest'
import {
  createAgendaEventRequestSchema,
  updateAgendaEventRequestSchema,
  rescheduleAgendaEventRequestSchema,
  listAgendaEventsQuerySchema,
  cancelAgendaEventRequestSchema,
} from '../../schemas/agenda-event-input.schema'

const base = {
  title: 'Visita ao imóvel',
  propertyReference: 'Centro',
  start: '2031-03-01T15:00:00Z',
  durationMinutes: 60,
  participantName: 'Ana',
  participantPhone: '11999999999',
}
it('preserva todos os vínculos legítimos de entrada e rejeita campos desconhecidos', () => {
  const input = {
    ...base,
    ownerEmail: 'ana@example.test',
    participantEmails: ['lu@example.test'],
    notes: 'Contato autorizado',
    audience: 'SHARED_TEAM' as const,
    responsibleId: 'agent-1',
    outsideBusinessHoursConfirmed: false,
  }
  const parsed = createAgendaEventRequestSchema.parse(input)
  expect(parsed).toMatchObject({ ...input, start: new Date(input.start) })
  expect(createAgendaEventRequestSchema.safeParse({ ...input, unexpected: true }).success).toBe(
    false,
  )
})
it.each([
  [updateAgendaEventRequestSchema, { title: 'Reunião' }],
  [rescheduleAgendaEventRequestSchema, { start: base.start }],
  [listAgendaEventsQuerySchema, { from: base.start, to: '2031-03-02T15:00:00Z' }],
  [cancelAgendaEventRequestSchema, { reason: 'Cliente indisponível' }],
] as const)('rejeita extras em todos os demais contratos de entrada', (schema, input) => {
  expect(schema.safeParse(input).success).toBe(true)
  expect(schema.safeParse({ ...input, unexpected: true }).success).toBe(false)
})
it.each([
  ['title', 200],
  ['participantName', 200],
  ['participantPhone', 32],
  ['propertyReference', 500],
  ['notes', 10000],
] as const)('aplica o teto aprovado de %s', (field, maximum) => {
  expect(
    createAgendaEventRequestSchema.safeParse({ ...base, [field]: 'a'.repeat(maximum) }).success,
  ).toBe(true)
  expect(
    createAgendaEventRequestSchema.safeParse({ ...base, [field]: 'a'.repeat(maximum + 1) }).success,
  ).toBe(false)
})
it('exige motivo em cancelamento e em PATCH com status CANCELLED', () => {
  expect(cancelAgendaEventRequestSchema.safeParse({ reason: '   ' }).success).toBe(false)
  expect(updateAgendaEventRequestSchema.safeParse({ status: 'CANCELLED' }).success).toBe(false)
  expect(
    updateAgendaEventRequestSchema.safeParse({
      status: 'CANCELLED',
      cancellationReason: 'Cliente indisponível',
    }).success,
  ).toBe(true)
  expect(
    updateAgendaEventRequestSchema.safeParse({
      title: 'Reunião',
      cancellationReason: 'Texto avulso',
    }).success,
  ).toBe(false)
})
