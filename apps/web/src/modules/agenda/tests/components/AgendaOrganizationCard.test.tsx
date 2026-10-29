import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { AgendaOrganizationCard } from '../../components/agenda-dashboard/AgendaOrganizationCard'

it('mostra cobrança em BRL e abre a rota tipada do lançamento', () => {
  render(
    <AgendaOrganizationCard
      item={{
        id: 'charge-c1',
        sourceId: 'c1',
        kind: 'charge',
        date: '2031-03-01',
        title: 'Aluguel',
        property: 'Apartamento',
        status: 'PENDING',
        amount: 1234.56,
      }}
    />,
  )
  expect(screen.getByRole('link')).toHaveAttribute('href', '/dashboard/finance/charges/c1')
  expect(screen.getByText(/1.234,56/)).toBeVisible()
  expect(screen.getByText(/Pendente/)).toBeVisible()
})
it('direciona atendimento ao chamado correspondente', () => {
  render(
    <AgendaOrganizationCard
      item={{
        id: 'scheduled-t1',
        sourceId: 't1',
        kind: 'ticketScheduled',
        date: '2031-03-01',
        time: '12:00',
        title: 'Vazamento',
        property: 'Apartamento',
        status: 'IN_PROGRESS',
      }}
    />,
  )
  expect(screen.getByRole('link')).toHaveAttribute('href', '/dashboard/maintenance/t1')
  expect(screen.getByText('Vazamento')).toBeVisible()
})
