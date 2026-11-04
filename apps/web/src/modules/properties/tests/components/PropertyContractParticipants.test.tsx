import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { contractsService } from '@/modules/contracts/services/contracts-service'
import { apiContractFixture } from '@/modules/contracts/tests/fixtures/contract'
import { PropertyDetailSidebar } from '../../components/PropertyDetailSidebar'
import type { DashboardProperty } from '../../types/dashboard-property'
import { dashboardProperties } from '../fixtures/dashboard-properties'

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { scope: 'tenant', tenantId: 'agency', user: { id: 'manager' }, role: 'OWNER' },
    status: 'authenticated',
  }),
}))

afterEach(() => {
  vi.restoreAllMocks()
})

function leaseFixture() {
  const lease = apiContractFixture({ id: 'lease-1', propertyId: 'property-1', status: 'ACTIVE' })
  lease.parties[0].name = 'Locador do contrato'
  lease.parties[1].name = 'Locatária do contrato'
  lease.parties.push({
    ...lease.parties[0],
    id: 'guarantor',
    role: 'GUARANTOR',
    name: 'Fiador do contrato',
  })
  return lease
}

function renderSidebar(overrides: Partial<DashboardProperty> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <PropertyDetailSidebar
        property={{
          ...dashboardProperties[0],
          id: 'property-1',
          apiStatus: 'RENTED',
          status: 'rented',
          activeContractId: 'lease-1',
          ...overrides,
        }}
      />
    </QueryClientProvider>,
  )
}

describe('Property contract participants', () => {
  it.each(['DRAFT', 'PUBLISHED', 'SOLD', 'INACTIVE'] as const)(
    'does not fetch or display participants for %s properties',
    (apiStatus) => {
      const get = vi.spyOn(contractsService, 'get')
      renderSidebar({ apiStatus })
      expect(screen.queryByText('Participantes')).not.toBeInTheDocument()
      expect(screen.getByText('Histórico de Atividade')).toBeVisible()
      expect(get).not.toHaveBeenCalled()
    },
  )

  it('does not display an empty card when there is no active contract', () => {
    const get = vi.spyOn(contractsService, 'get')
    renderSidebar({ activeContractId: null })
    expect(screen.queryByText('Participantes')).not.toBeInTheDocument()
    expect(get).not.toHaveBeenCalled()
  })

  it('loads the saved contract parties and translates their roles without requiring platform accounts', async () => {
    const lease = leaseFixture()
    let finish: (value: typeof lease) => void = () => {}
    const get = vi.spyOn(contractsService, 'get').mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve
      }),
    )
    renderSidebar()
    expect(screen.getByRole('status')).toHaveTextContent('Carregando participantes do contrato…')
    expect(screen.queryByText('Participantes')).not.toBeInTheDocument()
    await act(async () => {
      finish(lease)
    })
    expect(await screen.findByText('Locatária do contrato')).toBeVisible()
    expect(screen.getByText('Locador do contrato')).toBeVisible()
    expect(screen.getByText('Fiador do contrato')).toBeVisible()
    expect(screen.getByText('Locador')).toBeVisible()
    expect(screen.getByText('Locatário')).toBeVisible()
    expect(screen.getByText('Fiador')).toBeVisible()
    expect(get).toHaveBeenCalledWith('lease-1')
    expect(screen.queryByText(lease.parties[0].email)).not.toBeInTheDocument()
    expect(screen.queryByText(lease.parties[0].cpf)).not.toBeInTheDocument()
  })

  it.each(['DRAFT', 'AWAITING_SIGNATURE', 'CLOSED', 'CANCELED'] as const)(
    'does not display parties from a %s contract',
    async (status) => {
      vi.spyOn(contractsService, 'get').mockResolvedValue({ ...leaseFixture(), status })
      renderSidebar()
      await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
      expect(screen.queryByText('Participantes')).not.toBeInTheDocument()
      expect(screen.queryByText('Locatária do contrato')).not.toBeInTheDocument()
    },
  )

  it('does not display a contract belonging to a different property', async () => {
    vi.spyOn(contractsService, 'get').mockResolvedValue({
      ...leaseFixture(),
      propertyId: 'another-property',
    })
    renderSidebar()
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
    expect(screen.queryByText('Locatária do contrato')).not.toBeInTheDocument()
  })

  it('shows a localized error and supports retrying without exposing private error details', async () => {
    const get = vi
      .spyOn(contractsService, 'get')
      .mockRejectedValueOnce(new Error('Private contract details'))
      .mockResolvedValueOnce(leaseFixture())
    const user = userEvent.setup()
    renderSidebar()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar os participantes do contrato.',
    )
    expect(screen.queryByText('Private contract details')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Locatária do contrato')).toBeVisible()
    expect(get).toHaveBeenCalledTimes(2)
  })
})
