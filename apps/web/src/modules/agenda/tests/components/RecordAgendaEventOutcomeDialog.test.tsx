import { ThemeProvider } from '@mui/material'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { RecordAgendaEventOutcomeDialog } from '../../components/RecordAgendaEventOutcomeDialog'
import type { AgendaEvent } from '../../types/agenda-event'
import { agendaEventFixture } from '../fixtures/agenda-event'

function renderDialog(event: AgendaEvent, isPending = false) {
  const onConfirm = vi.fn()
  const onClose = vi.fn()
  render(
    <ThemeProvider theme={theme}>
      <RecordAgendaEventOutcomeDialog
        open
        isPending={isPending}
        event={event}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    </ThemeProvider>,
  )
  return { onConfirm, onClose }
}

describe('RecordAgendaEventOutcomeDialog', () => {
  it('pede o interesse do cliente só para visita realizada', async () => {
    const { onConfirm } = renderDialog(agendaEventFixture({ apiKind: 'VISIT', title: 'Visita' }))

    expect(screen.getByText('Como foi “Visita”?')).toBeVisible()
    expect(screen.getByText('Interesse do cliente')).toBeVisible()

    await userEvent.click(screen.getByRole('button', { name: 'Cliente não compareceu' }))
    expect(screen.queryByText('Interesse do cliente')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Salvar resultado' }))
    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith(
        { outcome: 'NO_SHOW', visitInterest: null, notes: '' },
        expect.anything(),
      ),
    )
  })

  it('não oferece ausência de cliente em evento interno', () => {
    renderDialog(agendaEventFixture({ internal: true, apiKind: 'MEETING' }))

    expect(screen.getByRole('button', { name: 'Realizado' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Cliente não compareceu' })).not.toBeInTheDocument()
    expect(screen.queryByText('Interesse do cliente')).not.toBeInTheDocument()
  })

  it('abre a correção com o resultado já registrado', () => {
    renderDialog(
      agendaEventFixture({
        apiKind: 'VISIT',
        status: 'COMPLETED',
        visitInterest: 'HIGH',
        outcomeNotes: 'Quer proposta.',
      }),
    )

    expect(screen.getByRole('button', { name: 'Realizado' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Alto' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Anotações (opcional)')).toHaveValue('Quer proposta.')
  })

  it('trava os campos enquanto salva', () => {
    const { onClose } = renderDialog(agendaEventFixture({ apiKind: 'MEETING' }), true)

    expect(screen.getByRole('button', { name: 'Realizado' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    expect(onClose).not.toHaveBeenCalled()
  })
})
