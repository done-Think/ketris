import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ContractsDashboardPage } from '../../components/ContractsDashboardPage'
import { contractsService } from '../../services/contracts-service'

const mocks = vi.hoisted(() => ({
  session: { tenantId: 'agency', user: { id: 'manager' }, role: 'OWNER' },
}))
vi.mock('next-auth/react', () => ({ useSession: () => ({ data: mocks.session }) }))
vi.mock('next/navigation', async () => ({
  ...(await vi.importActual<typeof import('next/navigation')>('next/navigation')),
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: vi.fn() }) }))

const summary = { total: 0, active: 0, expiring30: 0, expiring90: 0, closed: 0 }

function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ContractsDashboardPage />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  mocks.session = { tenantId: 'agency', user: { id: 'manager' }, role: 'OWNER' }
  vi.spyOn(contractsService, 'list').mockResolvedValue({ items: [], totalCount: 0, summary })
})
afterEach(() => vi.restoreAllMocks())

it('keeps the contracts title and the new contract action for the agency', async () => {
  show()
  expect(await screen.findByRole('heading', { name: 'Contratos' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Novo Contrato' })).toBeInTheDocument()
})

it('shows the renter her own rental, without the new contract action', async () => {
  mocks.session = { tenantId: 'renters', user: { id: 'renter' }, role: 'RENTER' }
  show()
  expect(await screen.findByRole('heading', { name: 'Meu aluguel' })).toBeInTheDocument()
  expect(
    screen.getByText(
      'Acompanhe o contrato, os pagamentos, os documentos e os chamados do seu aluguel.',
    ),
  ).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Novo Contrato' })).not.toBeInTheDocument()
})
