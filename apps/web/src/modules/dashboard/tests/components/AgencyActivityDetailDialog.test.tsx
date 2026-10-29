import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AgencyActivityDetailDialog } from '../../components/AgencyActivityDetailDialog'
import { agencyActivity } from '../fixtures/dashboard'
import { renderWithProviders } from '../fixtures/render'

describe('AgencyActivityDetailDialog', () => {
  it('não renderiza sem atividade', () => {
    renderWithProviders(<AgencyActivityDetailDialog activity={null} onClose={vi.fn()} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('omite o campo corretor quando ele não veio', () => {
    renderWithProviders(
      <AgencyActivityDetailDialog activity={{ ...agencyActivity, broker: '' }} onClose={vi.fn()} />,
    )

    expect(screen.queryByText('Corretor')).not.toBeInTheDocument()
    expect(screen.getByText('Assunto')).toBeInTheDocument()
    expect(screen.getByText('20/10/2026, 09:00')).toBeInTheDocument()
  })

  it('fecha pelos dois botões', async () => {
    const onClose = vi.fn()
    renderWithProviders(<AgencyActivityDetailDialog activity={agencyActivity} onClose={onClose} />)

    for (const button of screen.getAllByRole('button', { name: 'Fechar' })) {
      await userEvent.click(button)
    }

    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
