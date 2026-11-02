import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { Session } from 'next-auth'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useDashboardFaceCheckNotifications } from '@shared/hooks/use-dashboard-face-check-notifications'
import { useTenantSessionScope } from '@shared/hooks/use-tenant-session-scope'
import {
  dashboardFaceCheckNotificationsService,
  DashboardFaceCheckNotificationError,
} from '@shared/services/dashboard-face-check-notifications-service'
import type { DashboardFaceCheckNotificationCount } from '@shared/types/dashboard-face-check-notifications'
import type { UserRole } from '@shared/types/user-role'

vi.mock('@shared/hooks/use-tenant-session-scope', () => ({ useTenantSessionScope: vi.fn() }))
vi.mock('@shared/services/dashboard-face-check-notifications-service', async () => ({
  ...(await vi.importActual<
    typeof import('@shared/services/dashboard-face-check-notifications-service')
  >('@shared/services/dashboard-face-check-notifications-service')),
  dashboardFaceCheckNotificationsService: { count: vi.fn() },
}))

function scope(
  tenantId: string,
  userId: string,
  role: UserRole = 'RENTER',
  overrides: Partial<Session> = {},
) {
  const token = `token-${tenantId}-${userId}-${role}`
  vi.mocked(useTenantSessionScope).mockReturnValue({
    tenantId,
    userId,
    role,
    enabled: true,
    actorKey: [userId, role],
    session: {
      user: { id: userId },
      expires: '2099-01-01T00:00:00Z',
      scope: 'tenant',
      tenantId,
      role,
      accessToken: token,
      ...overrides,
    },
  })
  return token
}

function renderNotifications(client: QueryClient) {
  return renderHook(() => useDashboardFaceCheckNotifications(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  })
}

describe('pending verification notifications', () => {
  afterEach(() => vi.resetAllMocks())

  it('cancels pending count requests when the account changes or the bell unmounts', async () => {
    scope('tenant-a', 'candidate-a')
    vi.mocked(dashboardFaceCheckNotificationsService.count).mockImplementation(
      () => new Promise(() => undefined),
    )
    const client = new QueryClient()
    const view = renderNotifications(client)
    await waitFor(() =>
      expect(dashboardFaceCheckNotificationsService.count).toHaveBeenCalledTimes(1),
    )
    const previousSignal = vi.mocked(dashboardFaceCheckNotificationsService.count).mock.calls[0][0]
    scope('tenant-b', 'candidate-b')
    view.rerender()
    await waitFor(() => expect(previousSignal.aborted).toBe(true))
    await waitFor(() =>
      expect(dashboardFaceCheckNotificationsService.count).toHaveBeenCalledTimes(2),
    )
    const currentSignal = vi.mocked(dashboardFaceCheckNotificationsService.count).mock.calls[1][0]
    expect(currentSignal.aborted).toBe(false)
    view.unmount()
    expect(currentSignal.aborted).toBe(true)
    client.clear()
  })

  it.each([1, 3])(
    'aggregates %s pending requests without including personal data or capture tokens',
    async (count) => {
      const token = scope('tenant-a', 'candidate-a')
      vi.mocked(dashboardFaceCheckNotificationsService.count).mockResolvedValue({
        count: 8,
        pendingCount: count,
      })
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const view = renderNotifications(client)
      await waitFor(() => expect(view.result.current).toHaveLength(1))
      const notification = view.result.current[0]
      expect(notification.kind).toBe('faceCheckVerification')
      expect(notification.href).toEqual({
        pathname: '/dashboard/face_check/my-verifications',
        query: { start: 'next' },
      })
      expect(notification.message).toContain(
        count === 1 ? 'uma verificação pendente' : '3 verificações pendentes',
      )
      expect(JSON.stringify(notification)).not.toContain(token)
      expect(JSON.stringify(notification)).not.toContain('/verify/')
      expect(notification.metadata).toBeUndefined()
      expect(vi.mocked(dashboardFaceCheckNotificationsService.count).mock.calls[0][1]).toBe(token)
      view.unmount()
      client.clear()
    },
  )

  it('does not notify when existing requests have no pending capture', async () => {
    scope('tenant-a', 'candidate-a')
    vi.mocked(dashboardFaceCheckNotificationsService.count).mockResolvedValue({
      count: 5,
      pendingCount: 0,
    })
    const client = new QueryClient()
    const view = renderNotifications(client)
    await waitFor(() => expect(client.getQueryCache().getAll()[0]?.state.status).toBe('success'))
    expect(view.result.current).toEqual([])
    view.unmount()
    client.clear()
  })

  it('does not request notifications for a public signed-out header', () => {
    vi.mocked(useTenantSessionScope).mockReturnValue({
      tenantId: undefined,
      userId: undefined,
      role: undefined,
      enabled: false,
      actorKey: [],
      session: null,
    })
    const client = new QueryClient()
    const view = renderNotifications(client)
    expect(dashboardFaceCheckNotificationsService.count).not.toHaveBeenCalled()
    expect(view.result.current).toEqual([])
    view.unmount()
    client.clear()
  })

  it.each([{ accessToken: undefined }, { authUnavailable: true }])(
    'does not fetch with unavailable authentication (%s)',
    (override) => {
      scope('tenant-a', 'candidate-a', 'RENTER', override)
      const client = new QueryClient()
      const view = renderNotifications(client)
      expect(dashboardFaceCheckNotificationsService.count).not.toHaveBeenCalled()
      expect(view.result.current).toEqual([])
      view.unmount()
      client.clear()
    },
  )

  it.each([401, 403, 404])(
    'hides previously cached notifications after denial and does not retry (%s)',
    async (status) => {
      scope('tenant-a', 'candidate-a')
      vi.mocked(dashboardFaceCheckNotificationsService.count)
        .mockResolvedValueOnce({ count: 2, pendingCount: 2 })
        .mockRejectedValue(new DashboardFaceCheckNotificationError(status))
      const client = new QueryClient()
      const view = renderNotifications(client)
      await waitFor(() => expect(view.result.current).toHaveLength(1))
      await act(async () => {
        await client.invalidateQueries({ queryKey: ['dashboard', 'face-check-notifications'] })
      })
      await waitFor(() => expect(view.result.current).toEqual([]))
      expect(dashboardFaceCheckNotificationsService.count).toHaveBeenCalledTimes(2)
      view.unmount()
      client.clear()
    },
  )

  it.each([
    ['tenant-a', 'candidate-b', 'RENTER'],
    ['tenant-b', 'candidate-a', 'RENTER'],
    ['tenant-a', 'candidate-a', 'PROPERTY_OWNER'],
  ] as const)(
    'isolates notifications for tenant %s actor %s role %s',
    async (tenantId, userId, role) => {
      scope('tenant-a', 'candidate-a')
      let finishNext: (value: DashboardFaceCheckNotificationCount) => void = () => undefined
      vi.mocked(dashboardFaceCheckNotificationsService.count)
        .mockResolvedValueOnce({ count: 2, pendingCount: 2 })
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              finishNext = resolve
            }),
        )
      const client = new QueryClient()
      const view = renderNotifications(client)
      await waitFor(() => expect(view.result.current).toHaveLength(1))
      const token = scope(tenantId, userId, role)
      view.rerender()
      expect(view.result.current).toEqual([])
      await waitFor(() =>
        expect(dashboardFaceCheckNotificationsService.count).toHaveBeenCalledTimes(2),
      )
      expect(vi.mocked(dashboardFaceCheckNotificationsService.count).mock.calls[1][1]).toBe(token)
      await act(async () => {
        finishNext({ count: 0, pendingCount: 0 })
      })
      expect(view.result.current).toEqual([])
      view.unmount()
      client.clear()
    },
  )
})
