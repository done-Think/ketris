import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ContractTicketsPanel } from '../../components/ContractTicketsPanel'
import { maintenanceService } from '../../services/maintenance-service'
import { maintenanceTicketListItemFixture } from '../fixtures/maintenance-ticket'

vi.mock('@shared/hooks/use-tenant-session-scope', () => ({
  useTenantSessionScope: () => ({
    tenantId: 'renters',
    enabled: true,
    session: { user: { id: 'renter' }, role: 'RENTER' },
  }),
}))
afterEach(() => vi.restoreAllMocks())

function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ContractTicketsPanel contractId="contract-1" />
    </QueryClientProvider>,
  )
}

describe('ContractTicketsPanel', () => {
  it('lists the tickets of the contract with a link to each one and to all tickets', async () => {
    const list = vi
      .spyOn(maintenanceService, 'listContractTickets')
      .mockResolvedValue([
        maintenanceTicketListItemFixture({ id: 'ticket-1', title: 'Pia vazando', status: 'OPEN' }),
      ])
    show()

    expect(await screen.findByRole('link', { name: 'Pia vazando' })).toHaveAttribute(
      'href',
      '/dashboard/maintenance/ticket-1',
    )
    expect(list).toHaveBeenCalledWith('contract-1', 'pt-BR')
    expect(screen.getByText('Aberto')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver todos os chamados' })).toHaveAttribute(
      'href',
      '/dashboard/maintenance?contractId=contract-1',
    )
  })

  it('shows only the tickets that still need attention', async () => {
    vi.spyOn(maintenanceService, 'listContractTickets').mockResolvedValue(
      (
        [
          ['OPEN', 'Pia vazando'],
          ['IN_PROGRESS', 'Portão travado'],
          ['AWAITING_CONFIRMATION', 'Chuveiro trocado'],
          ['DISPUTED', 'Infiltração contestada'],
          ['RESOLVED', 'Lâmpada resolvida'],
          ['CLOSED', 'Torneira fechada'],
          ['CANCELED', 'Pedido cancelado'],
        ] as const
      ).map(([status, title]) => maintenanceTicketListItemFixture({ id: title, title, status })),
    )
    show()

    await screen.findByRole('link', { name: 'Pia vazando' })
    expect(
      screen
        .getAllByRole('link')
        .map((link) => link.textContent)
        .filter((text) => text !== 'Ver todos os chamados'),
    ).toEqual(['Pia vazando', 'Portão travado', 'Chuveiro trocado', 'Infiltração contestada'])
  })

  it('tells when the contract has no open tickets', async () => {
    vi.spyOn(maintenanceService, 'listContractTickets').mockResolvedValue([
      maintenanceTicketListItemFixture({
        id: 'done',
        title: 'Lâmpada resolvida',
        status: 'RESOLVED',
      }),
    ])
    show()
    expect(await screen.findByText('Nenhum chamado aberto para este contrato.')).toBeInTheDocument()
  })
})
