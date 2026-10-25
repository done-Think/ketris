import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CancelAgendaEventDialog } from '../../components/CancelAgendaEventDialog'

describe('CancelAgendaEventDialog', () => {
  it('renders the confirmation copy with the event title', () => {
    render(
      <CancelAgendaEventDialog
        open
        isPending={false}
        title="Visita Jardim Paulista"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Excluir evento' })).toBeVisible()
    expect(screen.getByText(/Visita Jardim Paulista/)).toBeVisible()
  })

  it('calls onConfirm and onClose from their respective buttons', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    render(
      <CancelAgendaEventDialog
        open
        isPending={false}
        title="Visita Jardim Paulista"
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    )

    await user.type(screen.getByLabelText('Motivo do cancelamento'), 'Cliente indisponível')
    await user.click(screen.getByRole('button', { name: 'Excluir' }))
    await waitFor(() => expect(onConfirm).toHaveBeenCalledOnce())

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('disables both actions while pending', () => {
    render(
      <CancelAgendaEventDialog
        open
        isPending
        title="Visita Jardim Paulista"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })
})

it('exige motivo antes de confirmar um novo cancelamento', async () => {
  const onConfirm = vi.fn()
  render(
    <CancelAgendaEventDialog
      open
      isPending={false}
      title="Visita"
      onClose={vi.fn()}
      onConfirm={onConfirm}
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Excluir' }))
  expect(await screen.findByText('Informe o motivo do cancelamento')).toBeVisible()
  expect(onConfirm).not.toHaveBeenCalled()
})
