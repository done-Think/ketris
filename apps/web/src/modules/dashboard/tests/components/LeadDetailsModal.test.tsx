import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { LeadDetailsModal } from '../../components/LeadDetailsModal'
import { recentLead } from '../fixtures/dashboard'
import { renderWithProviders } from '../fixtures/render'

describe('LeadDetailsModal', () => {
  it('mostra o briefing do lead', () => {
    renderWithProviders(<LeadDetailsModal lead={recentLead} onClose={vi.fn()} />)

    expect(screen.getByText('Detalhes do lead')).toBeInTheDocument()
    expect(screen.getByText('Apartamento 2 quartos')).toBeInTheDocument()
    expect(screen.getByText('Até R$ 3.000')).toBeInTheDocument()
    expect(screen.getByText('Site')).toBeInTheDocument()
    expect(screen.getByText('Sem observações registradas.')).toBeInTheDocument()
  })

  it('não abre sem lead e fecha pelo botão', async () => {
    const onClose = vi.fn()
    const { rerender } = renderWithProviders(<LeadDetailsModal lead={null} onClose={onClose} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    rerender(<LeadDetailsModal lead={recentLead} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(onClose).toHaveBeenCalled()
  })
})
