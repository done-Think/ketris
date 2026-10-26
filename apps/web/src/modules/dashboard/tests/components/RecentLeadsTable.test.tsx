import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { RecentLeadsTable } from '../../components/RecentLeadsTable'
import { recentLead } from '../fixtures/dashboard'
import { renderWithProviders } from '../fixtures/render'

describe('RecentLeadsTable', () => {
  it('mostra a mensagem de vazio', () => {
    renderWithProviders(<RecentLeadsTable leads={[]} onLeadSelect={vi.fn()} />)

    expect(screen.getByText('Nenhum lead recente encontrado.')).toBeInTheDocument()
  })

  it('lista o lead com status traduzido, link de ligação e detalhes', async () => {
    const onLeadSelect = vi.fn()
    renderWithProviders(<RecentLeadsTable leads={[recentLead]} onLeadSelect={onLeadSelect} />)

    expect(screen.getByText('Carlos Lima')).toBeInTheDocument()
    expect(screen.getByText('Novo')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ligar' })).toHaveAttribute('href', 'tel:11900000000')

    await userEvent.click(screen.getByRole('button', { name: 'Detalhes' }))

    expect(onLeadSelect).toHaveBeenCalledWith(recentLead)
  })
})
