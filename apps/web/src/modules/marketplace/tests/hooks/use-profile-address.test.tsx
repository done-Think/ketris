import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { useOwnProfileAddress, useSaveProfileAddress } from '../../hooks/use-profile-address'
import { profileAddressService } from '../../services/profile-address-service'
import { marketplaceQueryKeys } from '../../config/marketplace-query-keys'
import type { OwnPublicProfileAddress } from '../../types/profile-address'

const actor = vi.hoisted(() => ({ key: 'tenant:first:AGENT' }))
vi.mock('../../hooks/use-marketplace-actor-key', () => ({
  useMarketplaceActorKey: () => actor.key,
}))
vi.mock('../../services/profile-address-service', () => ({
  profileAddressService: { getOwn: vi.fn(), save: vi.fn() },
}))
beforeEach(() => {
  vi.clearAllMocks()
  actor.key = 'tenant:first:AGENT'
})
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
  return { client, wrapper: Wrapper }
}
it('does not display the previous account’s address after switching actors', async () => {
  vi.mocked(profileAddressService.getOwn)
    .mockResolvedValueOnce({ kind: 'broker', profileId: 'first', handle: 'first-name' })
    .mockResolvedValueOnce({ kind: 'broker', profileId: 'second', handle: 'second-name' })
  const { wrapper } = setup()
  const hook = renderHook(() => useOwnProfileAddress('broker'), { wrapper })
  await waitFor(() => expect(hook.result.current.data?.handle).toBe('first-name'))
  actor.key = 'tenant:second:AGENT'
  hook.rerender()
  expect(hook.result.current.data?.handle).not.toBe('first-name')
  await waitFor(() => expect(hook.result.current.data?.handle).toBe('second-name'))
})
it('writes a pending save into the initiating actor’s cache after an account switch', async () => {
  let complete: (address: OwnPublicProfileAddress) => void = () => {}
  vi.mocked(profileAddressService.save).mockReturnValue(
    new Promise((resolve) => {
      complete = resolve
    }),
  )
  const { client, wrapper } = setup()
  const firstKey = marketplaceQueryKeys.ownAddress(actor.key, 'broker')
  const hook = renderHook(() => useSaveProfileAddress('broker'), { wrapper })
  act(() => hook.result.current.mutate('changed-name'))
  await waitFor(() => expect(profileAddressService.save).toHaveBeenCalled())
  actor.key = 'tenant:second:AGENT'
  hook.rerender()
  act(() => complete({ kind: 'broker', profileId: 'first', handle: 'changed-name' }))
  await waitFor(() =>
    expect(client.getQueryData(firstKey)).toMatchObject({ handle: 'changed-name' }),
  )
  expect(client.getQueryData(marketplaceQueryKeys.ownAddress(actor.key, 'broker'))).toBeUndefined()
})

it('keeps the saved address when an older background request resolves afterwards', async () => {
  let complete: (address: OwnPublicProfileAddress) => void = () => {}
  vi.mocked(profileAddressService.getOwn).mockReturnValue(
    new Promise((resolve) => {
      complete = resolve
    }),
  )
  vi.mocked(profileAddressService.save).mockResolvedValue({
    kind: 'broker',
    profileId: 'first',
    handle: 'saved-name',
  })
  const { client, wrapper } = setup()
  const key = marketplaceQueryKeys.ownAddress(actor.key, 'broker')
  client.setQueryData(key, { kind: 'broker', profileId: 'first', handle: 'old-name' })
  const hook = renderHook(
    () => ({ own: useOwnProfileAddress('broker'), save: useSaveProfileAddress('broker') }),
    { wrapper },
  )
  await waitFor(() => expect(profileAddressService.getOwn).toHaveBeenCalled())
  act(() => hook.result.current.save.mutate('saved-name'))
  await waitFor(() => expect(client.getQueryData(key)).toMatchObject({ handle: 'saved-name' }))
  await act(async () => {
    complete({ kind: 'broker', profileId: 'first', handle: 'old-name' })
    await Promise.resolve()
    await Promise.resolve()
  })
  expect(client.getQueryData(key)).toMatchObject({ handle: 'saved-name' })
})
