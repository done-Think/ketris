import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { FinancialUpcomingDueList } from '../../components/FinancialUpcomingDueList'
import type { FinancialUpcomingDue } from '../../types/financial-entry'
import { renderWithProviders } from '../fixtures/render'

const due: FinancialUpcomingDue = {
  id: 'due-1',
  property: 'Apartamento 2 quartos em Gonzaga',
  client: 'Henrique Duarte',
  dueDate: '2026-12-05T03:00:00.000Z',
  amountValue: 7148,
  status: 'pending',
}

describe('FinancialUpcomingDueList', () => {
  it('says there is nothing due from today on when the list is empty', () => {
    renderWithProviders(<FinancialUpcomingDueList items={[]} onOpen={vi.fn()} />)

    expect(screen.getByText('Próximos vencimentos')).toBeInTheDocument()
    expect(screen.getByText('Nenhum vencimento a partir de hoje.')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('lists each due with property, client and amount and opens it', async () => {
    const onOpen = vi.fn()
    renderWithProviders(<FinancialUpcomingDueList items={[due]} onOpen={onOpen} />)

    expect(screen.queryByText('Nenhum vencimento a partir de hoje.')).not.toBeInTheDocument()
    expect(screen.getByText('Henrique Duarte')).toBeInTheDocument()
    expect(screen.getByText(/7\.148,00/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Apartamento 2 quartos em Gonzaga/ }))
    expect(onOpen).toHaveBeenCalledWith('due-1')
  })
})
