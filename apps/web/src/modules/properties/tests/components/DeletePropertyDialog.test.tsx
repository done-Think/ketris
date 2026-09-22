import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DeletePropertyDialog } from '../../components/DeletePropertyDialog'

describe('DeletePropertyDialog', () => {
  it('renders the confirmation copy with the property title', () => {
    render(
      <DeletePropertyDialog
        open
        isPending={false}
        title="Apartamento Jardins"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Excluir imóvel' })).toBeVisible()
    expect(screen.getByText(/Apartamento Jardins/)).toBeVisible()
    expect(screen.getByText(/permanente/)).toBeVisible()
  })

  it('calls onConfirm and onClose from their respective buttons', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    render(
      <DeletePropertyDialog
        open
        isPending={false}
        title="Apartamento Jardins"
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(onConfirm).toHaveBeenCalledOnce()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('disables both actions while pending', () => {
    render(
      <DeletePropertyDialog
        open
        isPending
        title="Apartamento Jardins"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })
})
