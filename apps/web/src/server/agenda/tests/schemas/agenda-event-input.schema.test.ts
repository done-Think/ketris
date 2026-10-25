import { describe, expect, it } from 'vitest'

import {
  createAgendaEventRequestSchema,
  listAgendaEventsQuerySchema,
  rescheduleAgendaEventRequestSchema,
  updateAgendaEventRequestSchema,
} from '../../schemas/agenda-event-input.schema'

describe('createAgendaEventRequestSchema', () => {
  const base = {
    title: 'Visita ao imóvel',
    start: '2026-10-01T13:00:00.000Z',
    durationMinutes: 60,
    participantName: 'Ana',
    participantPhone: '(11) 99999-0000',
  }

  it('accepts an internal team event without client contact or property', () => {
    expect(
      createAgendaEventRequestSchema.parse({
        title: base.title,
        start: base.start,
        durationMinutes: 60,
        internal: true,
        audience: 'ALL_AGENTS',
      }),
    ).toMatchObject({
      internal: true,
      audience: 'ALL_AGENTS',
      participantName: '',
      participantPhone: '',
    })
  })

  it('keeps contact and property mandatory for client events', () => {
    expect(
      createAgendaEventRequestSchema.safeParse({
        title: base.title,
        start: base.start,
        durationMinutes: 60,
        internal: false,
        audience: 'ALL_AGENTS',
      }).success,
    ).toBe(false)
  })

  it('requires an explicit audience for internal events', () => {
    expect(createAgendaEventRequestSchema.safeParse({ ...base, internal: true }).success).toBe(
      false,
    )
  })

  it('aceita payload válido com propertyId', () => {
    const result = createAgendaEventRequestSchema.safeParse({ ...base, propertyId: 'property-1' })

    expect(result.success).toBe(true)
  })

  it('aceita payload válido com propertyReference', () => {
    const result = createAgendaEventRequestSchema.safeParse({
      ...base,
      propertyReference: 'Apto fora da carteira',
    })

    expect(result.success).toBe(true)
  })

  it('rejeita quando nem propertyId nem propertyReference são informados', () => {
    const result = createAgendaEventRequestSchema.safeParse(base)

    expect(result.success).toBe(false)
  })

  it('rejeita duração menor que 15 minutos', () => {
    const result = createAgendaEventRequestSchema.safeParse({
      ...base,
      propertyId: 'property-1',
      durationMinutes: 10,
    })

    expect(result.success).toBe(false)
  })

  it('rejeita visita (kind VISIT) com duração menor que 30 minutos', () => {
    const result = createAgendaEventRequestSchema.safeParse({
      ...base,
      propertyId: 'property-1',
      kind: 'VISIT',
      durationMinutes: 15,
    })

    expect(result.success).toBe(false)
  })

  it('aceita visita (kind VISIT) com duração de 30 minutos ou mais', () => {
    const result = createAgendaEventRequestSchema.safeParse({
      ...base,
      propertyId: 'property-1',
      kind: 'VISIT',
      durationMinutes: 30,
    })

    expect(result.success).toBe(true)
  })

  it('não exige 30 minutos para outros tipos de evento', () => {
    const result = createAgendaEventRequestSchema.safeParse({
      ...base,
      propertyId: 'property-1',
      kind: 'FOLLOW_UP',
      durationMinutes: 15,
    })

    expect(result.success).toBe(true)
  })

  it('rejeita título muito curto', () => {
    const result = createAgendaEventRequestSchema.safeParse({
      ...base,
      propertyId: 'property-1',
      title: 'Vi',
    })

    expect(result.success).toBe(false)
  })

  it('aceita ownerEmail e participantEmails opcionais', () => {
    const result = createAgendaEventRequestSchema.safeParse({
      ...base,
      propertyReference: 'Apto',
      ownerEmail: 'locatario@ketris.dev',
      participantEmails: ['fiador@ketris.dev'],
    })

    expect(result.success).toBe(true)
  })

  it('rejeita e-mail de vínculo inválido', () => {
    const result = createAgendaEventRequestSchema.safeParse({
      ...base,
      propertyReference: 'Apto',
      participantEmails: ['nao-e-email'],
    })

    expect(result.success).toBe(false)
  })

  it('rejeita mais de 20 participantes', () => {
    const result = createAgendaEventRequestSchema.safeParse({
      ...base,
      propertyReference: 'Apto',
      participantEmails: Array.from({ length: 21 }, (_, index) => `p${index}@ketris.dev`),
    })

    expect(result.success).toBe(false)
  })
})

describe('updateAgendaEventRequestSchema', () => {
  it('rejeita objeto vazio', () => {
    const result = updateAgendaEventRequestSchema.safeParse({})

    expect(result.success).toBe(false)
  })

  it('aceita atualização parcial de um único campo', () => {
    const result = updateAgendaEventRequestSchema.safeParse({ status: 'PENDING' })

    expect(result.success).toBe(true)
  })

  it('aceita ownerEmail null (remover dono) e participantEmails [] (remover todos)', () => {
    expect(updateAgendaEventRequestSchema.safeParse({ ownerEmail: null }).success).toBe(true)
    expect(updateAgendaEventRequestSchema.safeParse({ participantEmails: [] }).success).toBe(true)
  })
})

describe('rescheduleAgendaEventRequestSchema', () => {
  it('aceita apenas start, sem durationMinutes', () => {
    const result = rescheduleAgendaEventRequestSchema.safeParse({
      start: '2026-10-02T10:00:00.000Z',
    })

    expect(result.success).toBe(true)
  })
})

describe('listAgendaEventsQuerySchema', () => {
  it('aceita from e to válidos', () => {
    const result = listAgendaEventsQuerySchema.safeParse({
      from: '2026-10-01T00:00:00.000Z',
      to: '2026-10-08T00:00:00.000Z',
    })

    expect(result.success).toBe(true)
  })

  it('rejeita quando from ou to estão ausentes', () => {
    const result = listAgendaEventsQuerySchema.safeParse({ from: '2026-10-01T00:00:00.000Z' })

    expect(result.success).toBe(false)
  })
})
