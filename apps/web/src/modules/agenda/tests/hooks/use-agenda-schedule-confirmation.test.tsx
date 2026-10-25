import { act, renderHook } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import dayjs from 'dayjs'
import { useAgendaScheduleConfirmation } from '../../hooks/use-agenda-schedule-confirmation'
import type { AgendaEventFormValues } from '../../types/agenda-event'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2031-03-01T08:00:00Z'))
})
afterEach(() => vi.useRealTimers())
function values(instant = '2031-03-01T22:00:00-03:00'): AgendaEventFormValues {
  const start = dayjs(instant)
  return {
    title: 'Reunião',
    internal: true,
    audience: 'ALL_AGENTS',
    responsibleId: '',
    customProperty: '',
    durationMinutes: 30,
    kind: 'MEETING',
    notes: '',
    participant: '',
    phone: '',
    propertyId: '',
    scheduledDate: start.format('YYYY-MM-DD'),
    scheduledTime: start.format('HH:mm'),
    outsideBusinessHoursConfirmed: false,
  }
}
function setup(initial = values()) {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  const result = renderHook(() => {
    const form = useForm<AgendaEventFormValues>({ defaultValues: initial })
    return {
      form,
      confirmation: useAgendaScheduleConfirmation({
        open: true,
        handleSubmit: form.handleSubmit,
        onSubmit,
      }),
    }
  })
  return { ...result, onSubmit }
}
it('aguarda confirmação e permite voltar sem perder os dados', async () => {
  const { result, onSubmit } = setup()
  await act(async () => result.current.confirmation.submit(result.current.form.getValues()))
  expect(result.current.confirmation.waiting).toBe(true)
  expect(onSubmit).not.toHaveBeenCalled()
  act(() => result.current.confirmation.cancel())
  expect(result.current.confirmation.waiting).toBe(false)
  expect(result.current.form.getValues('title')).toBe('Reunião')
})
it('envia uma única vez o período explicitamente confirmado', async () => {
  const { result, onSubmit } = setup()
  await act(async () => result.current.confirmation.submit(result.current.form.getValues()))
  await act(async () => result.current.confirmation.confirm())
  expect(onSubmit).toHaveBeenCalledOnce()
  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ outsideBusinessHoursConfirmed: true }),
  )
})
it('exige nova confirmação se outro período fora do horário foi informado', async () => {
  const { result, onSubmit } = setup()
  await act(async () => result.current.confirmation.submit(result.current.form.getValues()))
  act(() => result.current.form.setValue('durationMinutes', 45))
  await act(async () => result.current.confirmation.confirm())
  expect(onSubmit).not.toHaveBeenCalled()
  expect(result.current.confirmation.waiting).toBe(true)
  await act(async () => result.current.confirmation.confirm())
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ durationMinutes: 45 }))
})
it('usa os valores atuais se o período passa a estar no horário comercial', async () => {
  const { result, onSubmit } = setup()
  await act(async () => result.current.confirmation.submit(result.current.form.getValues()))
  const daytime = values('2031-03-01T12:00:00-03:00')
  act(() => {
    result.current.form.setValue('scheduledDate', daytime.scheduledDate)
    result.current.form.setValue('scheduledTime', daytime.scheduledTime)
  })
  await act(async () => result.current.confirmation.confirm())
  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({
      scheduledTime: daytime.scheduledTime,
      outsideBusinessHoursConfirmed: false,
    }),
  )
})
it('não abre confirmação para um horário comercial', async () => {
  const { result, onSubmit } = setup(values('2031-03-01T12:00:00-03:00'))
  await act(async () => result.current.confirmation.submit(result.current.form.getValues()))
  expect(result.current.confirmation.waiting).toBe(false)
  expect(onSubmit).toHaveBeenCalledOnce()
})
