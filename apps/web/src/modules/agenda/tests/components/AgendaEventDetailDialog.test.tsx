import { ThemeProvider } from '@mui/material'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { AgendaEventDetailDialog } from '../../components/AgendaEventDetailDialog'
import type { AgendaEvent } from '../../types/agenda-event'

const event: AgendaEvent = {
  id: 'agenda-001',
  scheduledDate: '2026-05-04',
  time: '09:00',
  durationMinutes: 60,
  title: 'Visita Jardim Paulista',
  property: 'Apartamento Jardim Paulista',
  propertyHref: '/dashboard/properties/apt-jardins-3q',
  participant: 'Ana Nóbrega',
  phone: '(11) 99842-2109',
  notes: 'Cliente quer validar luminosidade da sala.',
  status: 'Confirmada',
  tone: 'primary',
  kind: 'visit',
  createdBy: 'Roberto Souza',
  createdByRole: 'colleague',
}

function renderDialog(onReschedule = vi.fn()) {
  render(
    <ThemeProvider theme={theme}>
      <AgendaEventDetailDialog
        event={event}
        eventDate={event.scheduledDate}
        maxDate="2026-12-31"
        minDate="2026-01-01"
        onClose={vi.fn()}
        onReschedule={onReschedule}
        open
      />
    </ThemeProvider>,
  )

  return onReschedule
}

describe('AgendaEventDetailDialog', () => {
  it('renders the event details with a localized property link', () => {
    renderDialog()

    expect(screen.getByText(event.title)).toBeVisible()
    expect(screen.getByText(event.notes)).toBeVisible()
    expect(screen.getByText('Marcado por colega Roberto Souza')).toBeVisible()

    const propertyLink = screen.getByRole('link', { name: event.property })
    expect(propertyLink).toHaveAttribute('href', event.propertyHref)
  })

  it('submits the reschedule form through onReschedule', async () => {
    const onReschedule = renderDialog()

    fireEvent.change(screen.getByLabelText('Nova data'), { target: { value: '2026-05-10' } })
    fireEvent.change(screen.getByLabelText('Novo horário'), { target: { value: '15:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar reagendamento' }))

    await waitFor(() => expect(onReschedule).toHaveBeenCalledTimes(1))
    expect(onReschedule.mock.calls[0][0]).toEqual({
      scheduledDate: '2026-05-10',
      scheduledTime: '15:00',
    })
  })
})
