import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import { useContract, useContracts, useSignContractParty } from '../../hooks/use-contracts'
import { contractsService } from '../../services/contracts-service'
import { apiContractFixture } from '../fixtures/contract'
import type { UserRole } from '@shared/types/user-role'

const identity = vi.hoisted(() => ({ id: 'manager', role: 'OWNER' as UserRole }))
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { tenantId: 'agency', user: { id: identity.id }, role: identity.role },
  }),
}))
afterEach(() => {
  vi.restoreAllMocks()
  identity.id = 'manager'
  identity.role = 'OWNER'
})
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
  })
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
  return { client, wrapper: Wrapper }
}

it('não reaproveita lista ou detalhe de outro usuário ou papel da mesma imobiliária', async () => {
  vi.spyOn(contractsService, 'get').mockImplementation(async () =>
    apiContractFixture({ code: identity.id + ':' + identity.role }),
  )
  vi.spyOn(contractsService, 'list').mockImplementation(async () => ({
    items: [],
    totalCount: identity.id === 'manager' ? 9 : 1,
    summary: {
      total: identity.id === 'manager' ? 9 : 1,
      active: 0,
      closed: 0,
      expiring30: 0,
      expiring90: 0,
    },
  }))
  const { wrapper } = setup()
  const hook = renderHook(() => ({ detail: useContract('contract'), list: useContracts() }), {
    wrapper,
  })
  await waitFor(() => expect(hook.result.current.detail.data?.code).toBe('manager:OWNER'))
  expect(hook.result.current.list.data?.totalCount).toBe(9)
  identity.id = 'agent'
  identity.role = 'AGENT'
  hook.rerender()
  expect(hook.result.current.detail.data?.code).not.toBe('manager:OWNER')
  expect(hook.result.current.list.data?.totalCount).not.toBe(9)
  await waitFor(() => expect(hook.result.current.detail.data?.code).toBe('agent:AGENT'))
  identity.role = 'RENTER'
  hook.rerender()
  expect(hook.result.current.detail.data?.code).not.toBe('agent:AGENT')
  await waitFor(() => expect(hook.result.current.detail.data?.code).toBe('agent:RENTER'))
})

it('envia a evidência selecionada e invalida os dados relacionados após o registro manual', async () => {
  const sign = vi.spyOn(contractsService, 'signParty').mockResolvedValue(apiContractFixture())
  const { client, wrapper } = setup()
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  const hook = renderHook(() => useSignContractParty('contract'), { wrapper })
  await act(async () => {
    await hook.result.current.mutateAsync({ partyId: 'party', documentId: 'document' })
  })
  expect(sign).toHaveBeenCalledWith('contract', 'party', { documentId: 'document' })
  const keys = invalidate.mock.calls.map(([input]) => input?.queryKey)
  expect(keys).toEqual(
    expect.arrayContaining([
      ['contracts', 'agency'],
      ['properties'],
      ['crm', 'opportunities', 'agency'],
      ['financial', 'agency'],
      ['agenda', 'agency'],
      ['maintenance', 'agency'],
    ]),
  )
})
