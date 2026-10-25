import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authQueryKeys } from '../../config/auth-query-keys'
import { useUsers } from '../../hooks/use-users'
import { useCurrentUser, useUpdateCurrentUser } from '../../hooks/use-current-user'
import { useCreateUser } from '../../hooks/use-create-user'
import { useApproveUserMembership } from '../../hooks/use-approve-user-membership'
import { userService } from '../../services/user-service'

const { session } = vi.hoisted(() => ({
  session: { tenantId: 'tenant-1', role: 'OWNER', user: { id: 'user-1' } },
}))
vi.mock('next-auth/react', () => ({ useSession: () => ({ data: session }) }))
vi.mock('../../services/user-service', () => ({
  userService: {
    list: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    approveMembership: vi.fn(),
  },
}))
const scope = { tenantId: 'tenant-1', userId: 'user-1', role: 'OWNER' as const }
const user = {
  id: 'user-1',
  tenantId: 'tenant-1',
  name: 'Ana',
  email: 'ana@example.com',
  role: 'OWNER' as const,
  active: true,
  pendingApproval: false,
  phone: null,
  creci: null,
  avatarUrl: null,
}
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
  return { client, wrapper: Wrapper }
}

describe('user queries and mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(session, { tenantId: 'tenant-1', role: 'OWNER', user: { id: 'user-1' } })
    vi.mocked(userService.list).mockResolvedValue([user])
    vi.mocked(userService.get).mockResolvedValue(user)
    vi.mocked(userService.create).mockResolvedValue(user)
    vi.mocked(userService.update).mockResolvedValue(user)
    vi.mocked(userService.approveMembership).mockResolvedValue(user)
  })
  it('scopes the cached list to tenant, user and role and fetches again on each change', async () => {
    const { client, wrapper } = setup()
    const hook = renderHook(() => useUsers(), { wrapper })
    await waitFor(() => expect(hook.result.current.isSuccess).toBe(true))
    expect(client.getQueryData(authQueryKeys.users(scope))).toEqual([user])
    session.tenantId = 'tenant-2'
    hook.rerender()
    await waitFor(() => expect(userService.list).toHaveBeenCalledTimes(2))
    session.user.id = 'user-2'
    hook.rerender()
    await waitFor(() => expect(userService.list).toHaveBeenCalledTimes(3))
    session.role = 'AGENT'
    hook.rerender()
    await waitFor(() => expect(userService.list).toHaveBeenCalledTimes(4))
  })
  it('does not fetch without a session scope or when disabled', async () => {
    const { wrapper } = setup()
    renderHook(() => useUsers(false), { wrapper })
    session.tenantId = ''
    renderHook(() => useCurrentUser(), { wrapper })
    expect(userService.list).not.toHaveBeenCalled()
    expect(userService.get).not.toHaveBeenCalled()
  })
  it('fetches the current user separately from the tenant list', async () => {
    const { client, wrapper } = setup()
    const hook = renderHook(() => useCurrentUser(), { wrapper })
    await waitFor(() => expect(hook.result.current.data).toEqual(user))
    expect(userService.get).toHaveBeenCalledWith('user-1')
    expect(client.getQueryData(authQueryKeys.users(scope))).toBeUndefined()
  })
  it('invalidates only the scoped list after creating or approving a user', async () => {
    const { client, wrapper } = setup()
    client.setQueryData(authQueryKeys.users(scope), [])
    const otherScope = { ...scope, tenantId: 'other' }
    client.setQueryData(authQueryKeys.users(otherScope), [])
    const hooks = renderHook(
      () => ({ create: useCreateUser(), approve: useApproveUserMembership() }),
      { wrapper },
    )
    await act(() =>
      hooks.result.current.create.mutateAsync({
        name: 'Ana',
        email: 'ana@example.com',
        password: 'password',
        role: 'OWNER',
      }),
    )
    expect(client.getQueryState(authQueryKeys.users(scope))?.isInvalidated).toBe(true)
    expect(client.getQueryState(authQueryKeys.users(otherScope))?.isInvalidated).toBe(false)
    client.setQueryData(authQueryKeys.users(scope), [])
    await act(() => hooks.result.current.approve.mutateAsync('user-1'))
    expect(client.getQueryState(authQueryKeys.users(scope))?.isInvalidated).toBe(true)
    expect(client.getQueryState(authQueryKeys.users(otherScope))?.isInvalidated).toBe(false)
  })
  it('retains the original scope if the session changes during a save', async () => {
    const { client, wrapper } = setup()
    let resolveSave!: (value: typeof user) => void
    vi.mocked(userService.update).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve
        }),
    )
    const hook = renderHook(() => useUpdateCurrentUser(), { wrapper })
    let save!: Promise<unknown>
    act(() => {
      save = hook.result.current.mutateAsync({ name: 'Ana' })
    })
    await waitFor(() => expect(userService.update).toHaveBeenCalled())
    session.tenantId = 'tenant-2'
    hook.rerender()
    await act(async () => {
      resolveSave(user)
      await save
    })
    expect(client.getQueryData(authQueryKeys.currentUser(scope))).toEqual(user)
    expect(
      client.getQueryData(authQueryKeys.currentUser({ ...scope, tenantId: 'tenant-2' })),
    ).toBeUndefined()
  })
})
