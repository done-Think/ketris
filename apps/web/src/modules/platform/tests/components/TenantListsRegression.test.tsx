import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TenantUsersList } from '../../components/TenantUsersList'
import { TenantsList } from '../../components/TenantsList'

const { useTenantUsers, useTenantsPage } = vi.hoisted(() => ({
  useTenantUsers: vi.fn(),
  useTenantsPage: vi.fn(),
}))
vi.mock('../../hooks/use-tenants', () => ({ useTenantUsers, useTenantsPage }))
vi.mock('../../hooks/use-platform-actor', () => ({
  usePlatformActor: () => ({ key: 'admin-1:AGENT', enabled: true, canManage: false }),
}))

describe('existing Platform list behavior', () => {
  it('reaches the users after the hundredth record through the server pages', async () => {
    const user = userEvent.setup()
    vi.mocked(useTenantUsers).mockImplementation((_tenantId, page: number, pageSize: number) => ({
      data: {
        users: Array.from({ length: pageSize }, (_, index) => ({
          id: `user-${(page - 1) * pageSize + index}`,
          tenantId: 'tenant',
          name: `User ${(page - 1) * pageSize + index}`,
          email: `user${index}@example.test`,
          avatarUrl: null,
          role: 'AGENT',
          active: true,
          pendingApproval: false,
        })),
        totalCount: 105,
        page,
        pageSize,
      },
      isPending: false,
      isError: false,
    }))
    render(<TenantUsersList tenantId="tenant" />)

    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(21)
    expect(screen.getByText('105')).toBeVisible()
    await user.click(screen.getByRole('button', { name: /next page/i }))

    expect(useTenantUsers).toHaveBeenLastCalledWith('tenant', 2, 20)
    expect(screen.getByText('User 20')).toBeVisible()
  })

  it('preserves the existing link to a tenant detail', () => {
    vi.mocked(useTenantsPage).mockReturnValue({
      data: {
        tenants: [
          {
            id: 'existing',
            name: 'Existing agency',
            slug: 'agency',
            accountType: 'AGENCY',
            status: 'ACTIVE',
            canceledAt: null,
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
        totalCount: 1,
        page: 1,
        pageSize: 20,
        statusCounts: { TRIAL: 0, ACTIVE: 1, SUSPENDED: 0, CANCELED: 0 },
      },
      isPending: false,
      isError: false,
    })
    render(<TenantsList />)
    expect(screen.getByText('Existing agency').closest('a')).toHaveAttribute(
      'href',
      '/platform/tenants/existing',
    )
  })
})
