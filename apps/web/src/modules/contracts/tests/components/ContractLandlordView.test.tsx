import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import { ContractsDashboardPage } from '../../components/ContractsDashboardPage'
import { ContractDetailDashboardPage } from '../../components/ContractDetailDashboardPage'
import { contractsService } from '../../services/contracts-service'
import { apiContractFixture } from '../fixtures/contract'

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { tenantId: 'agency', user: { id: 'manager' }, role: 'OWNER' } }),
}))
vi.mock('next/navigation', async () => ({
  ...(await vi.importActual<typeof import('next/navigation')>('next/navigation')),
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: vi.fn() }) }))
afterEach(() => vi.restoreAllMocks())
function show(element: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{element}</QueryClientProvider>)
}
const summary = { total: 1, active: 1, expiring30: 0, expiring90: 0, closed: 0 }

it('mostra ao locador o contrato de outra imobiliária só para consulta', async () => {
  vi.spyOn(contractsService, 'get').mockResolvedValue(
    apiContractFixture({
      status: 'ACTIVE',
      tenantId: 'partner-agency',
      agencyName: 'Imobiliária Parceira',
    }),
  )
  vi.spyOn(contractsService, 'history').mockResolvedValue({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 10,
  })
  show(<ContractDetailDashboardPage contractId="contract" />)
  expect(
    await screen.findByText(
      'Você acompanha este contrato como locador. Quem administra é a Imobiliária Parceira. Para alterar algo, fale com a imobiliária.',
    ),
  ).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Encerrar contrato' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Confirmar vínculo/ })).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Registrar assinatura manual' }),
  ).not.toBeInTheDocument()
})

it('marca na lista os contratos administrados por outra imobiliária', async () => {
  vi.spyOn(contractsService, 'list').mockResolvedValue({
    items: [
      {
        canEdit: false,
        id: 'contract',
        tenantId: 'partner-agency',
        agencyName: 'Imobiliária Parceira',
        code: 'CTR-2026-0001',
        opportunityId: 'opportunity',
        propertyId: 'property',
        propertyTitle: 'Apartamento da Paula',
        propertyAddress: 'Rua A, Centro',
        ownerName: 'Paula',
        tenantName: 'Lia',
        status: 'ACTIVE',
        type: 'RESIDENTIAL',
        amount: 3000,
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2027-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    totalCount: 1,
    summary,
  })
  show(<ContractsDashboardPage />)
  expect(await screen.findByText('Administrado por Imobiliária Parceira')).toBeInTheDocument()
})
