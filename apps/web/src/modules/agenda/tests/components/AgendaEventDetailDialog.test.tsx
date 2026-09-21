import { ThemeProvider } from '@mui/material'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { AgendaEventDetailDialog } from '../../components/AgendaEventDetailDialog'
import type { AgendaEvent, AgendaPropertyOption } from '../../types/agenda-event'

const propertyOptions: AgendaPropertyOption[] = [
  {
    href: '/dashboard/properties/apt-jardins-3q',
    id: 'apt-jardins-3q',
    label: 'Apartamento Jardins',
  },
]

const event: AgendaEvent = {
  id: 'agenda-001',
  scheduledDate: '2026-05-04',
  time: '09:00',
  durationMinutes: 60,
  title: 'Visita Jardim Paulista',
  property: 'Apartamento Jardim Paulista',
  propertyHref: '/dashboard/properties/apt-jardins-3q',
  propertyId: 'apt-jardins-3q',
  apiKind: 'VISIT',
  participant: 'Ana Nóbrega',
  phone: '(11) 99842-2109',
  notes: 'Cliente quer validar luminosidade da sala.',
  status: 'Confirmada',
  tone: 'primary',
  kind: 'visit',
  createdBy: 'Roberto Souza',
  createdByRole: 'colleague',
}

function renderDialog(
  overrides: Partial<{
    onEdit: ReturnType<typeof vi.fn>
    onDelete: ReturnType<typeof vi.fn>
  }> = {},
) {
  const onEdit = overrides.onEdit ?? vi.fn().mockResolvedValue(true)
  const onDelete = overrides.onDelete ?? vi.fn().mockResolvedValue(true)
  const onClose = vi.fn()

  render(
    <ThemeProvider theme={theme}>
      <AgendaEventDetailDialog
        event={event}
        isDeleting={false}
        isSaving={false}
        maxDate="2026-12-31"
        minDate="2026-01-01"
        onClose={onClose}
        onDelete={onDelete}
        onEdit={onEdit}
        open
        propertyOptions={propertyOptions}
      />
    </ThemeProvider>,
  )

  return { onClose, onDelete, onEdit }
}

describe('AgendaEventDetailDialog', () => {
  it('renders the event details with a localized property link and Excluir/Editar actions', () => {
    renderDialog()

    expect(screen.getByText(event.title)).toBeVisible()
    expect(screen.getByText(event.notes)).toBeVisible()
    expect(screen.getByText('Marcado por colega Roberto Souza')).toBeVisible()

    const propertyLink = screen.getByRole('link', { name: event.property })
    expect(propertyLink).toHaveAttribute('href', event.propertyHref)

    expect(screen.getByRole('button', { name: 'Excluir' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Editar' })).toBeVisible()
  })

  it('shows a placeholder when the event has no property linked', () => {
    renderDialog()

    expect(screen.queryByText('Sem imóvel vinculado')).not.toBeInTheDocument()
  })

  it('switches to the edit form pre-filled with the event data when Editar is clicked, without saving anything', async () => {
    const { onEdit } = renderDialog()

    await userEvent.click(screen.getByRole('button', { name: 'Editar' }))

    expect(screen.getByLabelText('Título')).toHaveValue('Visita Jardim Paulista')
    expect(screen.getByLabelText('Cliente')).toHaveValue('Ana Nóbrega')
    expect(screen.getByLabelText('Telefone')).toHaveValue('(11) 99842-2109')
    expect(screen.getByLabelText('Data')).toHaveValue('2026-05-04')
    expect(screen.getByLabelText('Horário')).toHaveValue('09:00')
    expect(screen.getByLabelText('Duração')).toHaveValue(60)
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeVisible()
    expect(onEdit).not.toHaveBeenCalled()
  })

  it('returns to the view mode without saving when Cancelar is clicked during edit', async () => {
    const { onEdit } = renderDialog()

    await userEvent.click(screen.getByRole('button', { name: 'Editar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.getByRole('button', { name: 'Editar' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Excluir' })).toBeVisible()
    expect(onEdit).not.toHaveBeenCalled()
  })

  it('submits the edited values through onEdit and returns to view mode on success', async () => {
    const onEdit = vi.fn().mockResolvedValue(true)
    renderDialog({ onEdit })

    await userEvent.click(screen.getByRole('button', { name: 'Editar' }))

    const titleField = screen.getByLabelText('Título')
    await userEvent.clear(titleField)
    await userEvent.type(titleField, 'Visita remarcada')

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(onEdit).toHaveBeenCalledTimes(1))
    expect(onEdit.mock.calls[0][0]).toMatchObject({ title: 'Visita remarcada' })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Editar' })).toBeVisible())
  })

  it('stays in edit mode when saving fails', async () => {
    const onEdit = vi.fn().mockResolvedValue(false)
    renderDialog({ onEdit })

    await userEvent.click(screen.getByRole('button', { name: 'Editar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(onEdit).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeVisible()
  })

  it('asks for confirmation and calls onDelete when Excluir is confirmed', async () => {
    const onDelete = vi.fn().mockResolvedValue(true)
    const { onClose } = renderDialog({ onDelete })

    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }))

    const confirmDialog = (await screen.findByText('Excluir evento')).closest(
      '[role="dialog"]',
    ) as HTMLElement
    await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Excluir' }))

    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('does not close the dialog when deletion fails', async () => {
    const onDelete = vi.fn().mockResolvedValue(false)
    const { onClose } = renderDialog({ onDelete })

    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }))

    const confirmDialog = (await screen.findByText('Excluir evento')).closest(
      '[role="dialog"]',
    ) as HTMLElement
    await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Excluir' }))

    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1))
    expect(onClose).not.toHaveBeenCalled()
  })
})
