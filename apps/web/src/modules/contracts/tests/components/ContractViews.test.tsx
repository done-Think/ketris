import { AxiosError } from 'axios'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import { ContractsDashboardPage } from '../../components/ContractsDashboardPage'
import { ContractDetailDashboardPage } from '../../components/ContractDetailDashboardPage'
import { ContractsCreatePage } from '../../components/ContractsCreatePage'
import { ContractsEmptyState } from '../../components/ContractsEmptyState'
import { contractsService } from '../../services/contracts-service'
import { apiContractFixture } from '../fixtures/contract'

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { tenantId: 'agency', user: { id: 'manager' }, role: 'OWNER' } }),
}))
vi.mock('next/navigation', async () => ({
  ...(await vi.importActual<typeof import('next/navigation')>('next/navigation')),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: vi.fn() }) }))
afterEach(() => vi.restoreAllMocks())
function show(element: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{element}</QueryClientProvider>)
}
const summary = { total: 26, active: 10, expiring30: 3, expiring90: 7, closed: 2 }

it('usa paginação no servidor e mantém os indicadores completos ao selecionar o filtro', async () => {
  const list = vi
    .spyOn(contractsService, 'list')
    .mockResolvedValue({ items: [], totalCount: 26, summary })
  show(<ContractsDashboardPage />)
  await waitFor(() =>
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 5 })),
  )
  expect(await screen.findByText('3')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Vencendo/ }))
  await waitFor(() =>
    expect(list).toHaveBeenLastCalledWith(
      expect.objectContaining({ period: 'NEXT_90_DAYS', page: 1 }),
    ),
  )
  expect(await screen.findByText('3')).toBeInTheDocument()
  expect(screen.getByText(/Vencendo em 30d/)).toBeInTheDocument()
})

it('mostra erro recuperável no detalhe para falha de rede sem apresentar 404', async () => {
  vi.spyOn(contractsService, 'get').mockRejectedValue(new AxiosError('Network error'))
  show(<ContractDetailDashboardPage contractId="contract" />)
  expect(await screen.findByText('Não foi possível carregar o contrato.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeEnabled()
})

it('renderiza dados e ações reais, removendo edição após a primeira assinatura', async () => {
  const contract = apiContractFixture()
  contract.parties[0].signatureStatus = 'SIGNED'
  contract.parties[0].signatureMethod = 'MANUAL'
  vi.spyOn(contractsService, 'get').mockResolvedValue(contract)
  vi.spyOn(contractsService, 'history').mockResolvedValue({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 10,
  })
  show(<ContractDetailDashboardPage contractId="contract" />)
  expect(await screen.findByRole('heading', { name: /Contrato #0001/ })).toBeInTheDocument()
  expect(screen.getByText('Apartamento')).toBeInTheDocument()
  expect(screen.getByText('Registro manual')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Cancelar contrato' })).toBeEnabled()
  expect(
    screen.queryByRole('button', { name: /Enviar assinatura|Duplicar|Copiar link/ }),
  ).not.toBeInTheDocument()
})

it('não permite avançar o cadastro sem uma proposta aceita selecionada', async () => {
  vi.spyOn(contractsService, 'opportunities').mockResolvedValue({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 25,
  })
  show(<ContractsCreatePage />)
  fireEvent.click(screen.getByRole('button', { name: 'Próximo passo' }))
  expect(await screen.findByText('Selecione a oportunidade aceita')).toBeInTheDocument()
  expect(screen.queryByLabelText('Nome do locador')).not.toBeInTheDocument()
})

it('apresenta a ação real de criação no estado vazio somente quando autorizada', () => {
  const create = vi.fn()
  const { rerender } = render(<ContractsEmptyState onCreateContract={create} />)
  fireEvent.click(screen.getByRole('button', { name: 'Gerar contrato' }))
  expect(create).toHaveBeenCalledOnce()
  rerender(<ContractsEmptyState />)
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})
