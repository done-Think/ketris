import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DeactivatePropertyDialog } from '../../components/DeactivatePropertyDialog'

describe('DeactivatePropertyDialog', () => {
  it('renders the confirmation copy with the property title', () => {
    render(
      <DeactivatePropertyDialog
        open
        isPending={false}
        title="Apartamento Jardins"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Excluir imóvel' })).toBeVisible()
    expect(screen.getByText(/Apartamento Jardins/)).toBeVisible()
  })

  it('calls onConfirm and onClose from their respective buttons', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    render(
      <DeactivatePropertyDialog
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
      <DeactivatePropertyDialog
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
