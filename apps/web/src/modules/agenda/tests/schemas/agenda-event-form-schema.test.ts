import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { buildAgendaEventFormSchema } from '../../schemas/agenda-event-form-schema'

const t = (key: string) => key

const baseValues = {
  customProperty: '',
  durationMinutes: 60,
  kind: '' as const,
  notes: '',
  participant: 'Cliente Teste',
  phone: '(11) 99999-0000',
  propertyId: 'property-1',
  scheduledDate: '2026-09-29',
  scheduledTime: '13:00',
  title: 'Visita ao imóvel',
}

describe('buildAgendaEventFormSchema', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-29T09:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('aceita um horário com pelo menos 3 horas de antecedência dentro do horário comercial', () => {
    const result = buildAgendaEventFormSchema(t).safeParse(baseValues)
    expect(result.success).toBe(true)
  })

  it('rejeita um horário com menos de 3 horas de antecedência', () => {
    const result = buildAgendaEventFormSchema(t).safeParse({
      ...baseValues,
      scheduledTime: '10:00',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['scheduledTime'])
      expect(result.error.issues[0]?.message).toBe('minimumAdvanceNotice')
    }
  })

  it('rejeita um horário fora do horário comercial', () => {
    const result = buildAgendaEventFormSchema(t).safeParse({
      ...baseValues,
      scheduledDate: '2026-09-30',
      scheduledTime: '22:00',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('outsideBusinessHours')
    }
  })

  it('não reaplica a regra quando o horário é o mesmo já salvo (edição sem mudar data/hora)', () => {
    const result = buildAgendaEventFormSchema(t, {
      unchangedScheduleDate: '2026-01-01',
      unchangedScheduleTime: '22:00',
    }).safeParse({
      ...baseValues,
      scheduledDate: '2026-01-01',
      scheduledTime: '22:00',
    })

    expect(result.success).toBe(true)
  })

  it('reaplica a regra quando o horário muda, mesmo em modo de edição', () => {
    const result = buildAgendaEventFormSchema(t, {
      unchangedScheduleDate: '2026-01-01',
      unchangedScheduleTime: '22:00',
    }).safeParse({
      ...baseValues,
      scheduledDate: '2026-01-01',
      scheduledTime: '23:00',
    })

    expect(result.success).toBe(false)
  })

  it('routes each validation message through the translator with the right key', () => {
    const translated = buildAgendaEventFormSchema((key) => `translated:${key}`)
    const result = translated.safeParse({ ...baseValues, title: '' })

    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe(
      'translated:titleRequired',
    )
  })
})
