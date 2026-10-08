import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { TenantUsersList } from '../../components/TenantUsersList'
import { TenantsList } from '../../components/TenantsList'

const { useTenantUsers, useTenants } = vi.hoisted(() => ({
  useTenantUsers: vi.fn(),
  useTenants: vi.fn(),
}))
vi.mock('../../hooks/use-tenant-users', () => ({ useTenantUsers }))
vi.mock('../../hooks/use-tenants', () => ({ useTenants }))

describe('existing Platform list behavior', () => {
  it('renders all users, including those after the hundredth record', () => {
    vi.mocked(useTenantUsers).mockReturnValue({
      data: Array.from({ length: 105 }, (_, index) => ({
        id: `user-${index}`,
        tenantId: 'tenant',
        nome: `User ${index}`,
        email: `user${index}@example.test`,
        papel: 'AGENT',
        ativo: true,
      })),
      isLoading: false,
      isError: false,
    })
    render(<TenantUsersList tenantId="tenant" />)
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(106)
    expect(screen.getByText('User 104')).toBeVisible()
    expect(useTenantUsers).toHaveBeenCalledWith('tenant')
  })

  it('preserves the existing link to a tenant detail', () => {
    vi.mocked(useTenants).mockReturnValue({
      data: [
        {
          id: 'existing',
          nome: 'Existing agency',
          slug: 'agency',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
      isLoading: false,
      isError: false,
    })
    render(<TenantsList />)
    expect(screen.getByText('Existing agency').closest('a')).toHaveAttribute(
      'href',
      '/platform/tenants/existing',
    )
  })
})
