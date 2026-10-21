import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SnackbarProvider } from 'notistack'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { AgendaEventFormDialog } from '../../components/AgendaEventFormDialog'
import { AgendaEventDetailDialog } from '../../components/AgendaEventDetailDialog'
import type { AgendaEvent } from '../../types/agenda-event'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-20T10:00:00-03:00'))
})
afterEach(() => vi.useRealTimers())

function createForm() {
  const onCreate = vi.fn().mockResolvedValue(undefined)
  const onClose = vi.fn()
  render(
    <SnackbarProvider domRoot={document.body}>
      <AgendaEventFormDialog
        open
        canManageAudience
        propertyOptions={[]}
        onCreate={onCreate}
        onClose={onClose}
        minDate="2026-10-20"
        maxDate="2031-12-31"
        initialValues={{
          internal: true,
          audience: 'ALL_AGENTS',
          title: 'Late meeting',
          kind: 'MEETING',
          scheduledDate: '2031-03-01',
          scheduledTime: '22:00',
          durationMinutes: 30,
        }}
      />
    </SnackbarProvider>,
  )
  return { onCreate, onClose }
}

it('waits for a decision and preserves the filled form when returning', async () => {
  const { onCreate } = createForm()
  await userEvent.click(screen.getByRole('button', { name: 'Criar evento' }))
  expect(await screen.findByText(/fora do horário comercial/)).toBeVisible()
  expect(onCreate).not.toHaveBeenCalled()
  await userEvent.click(screen.getByRole('button', { name: 'Voltar' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Criar evento' })).toBeEnabled())
  expect(screen.getByLabelText('Título')).toHaveValue('Late meeting')
  expect(screen.getByLabelText('Horário')).toHaveValue('22:00')
  expect(onCreate).not.toHaveBeenCalled()
})

it('saves exactly once with explicit confirmation after continuing', async () => {
  const { onCreate } = createForm()
  await userEvent.click(screen.getByRole('button', { name: 'Criar evento' }))
  await userEvent.click(await screen.findByRole('button', { name: 'Continuar' }))
  await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1))
  expect(onCreate.mock.calls[0][0]).toMatchObject({
    scheduledTime: '22:00',
    outsideBusinessHoursConfirmed: true,
  })
})

it('cancels the pending submission when the form closes', async () => {
  const { onCreate, onClose } = createForm()
  await userEvent.click(screen.getByRole('button', { name: 'Criar evento' }))
  await screen.findByRole('button', { name: 'Continuar' })
  await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(onClose).toHaveBeenCalledTimes(1)
  expect(onCreate).not.toHaveBeenCalled()
})

it('revalidates changed values instead of saving the stale period shown before confirmation', async () => {
  const { onCreate } = createForm()
  await userEvent.click(screen.getByRole('button', { name: 'Criar evento' }))
  await screen.findByRole('button', { name: 'Continuar' })
  fireEvent.change(screen.getByLabelText('Horário'), { target: { value: '12:00' } })
  await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
  await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1))
  expect(onCreate.mock.calls[0][0]).toMatchObject({
    scheduledTime: '12:00',
    outsideBusinessHoursConfirmed: false,
  })
})

it('warns when an edited duration extends past business hours', async () => {
  const event: AgendaEvent = {
    id: 'event',
    scheduledDate: '2031-03-01',
    time: '17:30',
    durationMinutes: 30,
    title: 'Meeting',
    property: '',
    propertyHref: '',
    propertyId: null,
    apiKind: 'MEETING',
    participant: '',
    phone: '',
    notes: '',
    status: 'Confirmada',
    tone: 'info',
    audience: 'ALL_AGENTS',
    internal: true,
  }
  const onEdit = vi.fn().mockResolvedValue(true)
  render(
    <SnackbarProvider domRoot={document.body}>
      <AgendaEventDetailDialog
        open
        canManageAudience
        event={event}
        propertyOptions={[]}
        isDeleting={false}
        isSaving={false}
        onClose={vi.fn()}
        onDelete={vi.fn()}
        onEdit={onEdit}
        minDate="2026-10-20"
        maxDate="2031-12-31"
      />
    </SnackbarProvider>,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Editar' }))
  fireEvent.change(screen.getByLabelText('Duração'), { target: { value: '60' } })
  await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(await screen.findByText(/fora do horário comercial/)).toBeVisible()
  expect(onEdit).not.toHaveBeenCalled()
  await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
  await waitFor(() => expect(onEdit).toHaveBeenCalledTimes(1))
  expect(onEdit.mock.calls[0][0]).toMatchObject({
    scheduledTime: '17:30',
    durationMinutes: 60,
    outsideBusinessHoursConfirmed: true,
  })
})
