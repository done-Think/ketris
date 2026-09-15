import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ArchiveContactDialog } from '../../components/contacts-list/ArchiveContactDialog'

describe('ArchiveContactDialog', () => {
  it('renders the confirmation copy', () => {
    render(<ArchiveContactDialog open isPending={false} onClose={vi.fn()} onConfirm={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Arquivar contato?' })).toBeVisible()
    expect(
      screen.getByText(
        'O contato deixará de aparecer na lista ativa, mas continuará armazenado no CRM.',
      ),
    ).toBeVisible()
  })

  it('calls onConfirm and onClose from their respective buttons', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    render(<ArchiveContactDialog open isPending={false} onClose={onClose} onConfirm={onConfirm} />)

    await user.click(screen.getByRole('button', { name: 'Arquivar' }))
    expect(onConfirm).toHaveBeenCalledOnce()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('disables both actions while pending', () => {
    render(<ArchiveContactDialog open isPending onClose={vi.fn()} onConfirm={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })
})
