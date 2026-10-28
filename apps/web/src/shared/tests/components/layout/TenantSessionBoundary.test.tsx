import { render, screen, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clearClientSession } from '@shared/lib/auth/clear-client-session'

import { TenantSessionBoundary } from '@shared/components/layout/TenantSessionBoundary'

const routerMock = { replace: vi.fn(), refresh: vi.fn() }

vi.mock('@/i18n/navigation', async () => {
  const React = await import('react')

  return {
    ...(await vi.importActual<typeof import('@/i18n/navigation')>('@/i18n/navigation')),
    useRouter: () => routerMock,
    Link: React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
      function MockLocalizedLink({ href = '', ...props }, ref) {
        return React.createElement('a', { ...props, href, ref })
      },
    ),
  }
})

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

vi.mock('@shared/lib/auth/clear-client-session', () => ({
  clearClientSession: vi.fn().mockResolvedValue(undefined),
}))

function mockSession(overrides?: Record<string, unknown>) {
  vi.mocked(useSession).mockReturnValue({
    data: { scope: 'tenant', tenantId: 't1', role: 'AGENT', ...overrides },
    status: 'authenticated',
    update: vi.fn(),
  } as unknown as ReturnType<typeof useSession>)
}

function renderBoundary() {
  return render(
    <TenantSessionBoundary>
      <div>Conteúdo do CRM</div>
    </TenantSessionBoundary>,
  )
}

describe('TenantSessionBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza o conteúdo para uma sessão de tenant válida (AGENT)', () => {
    mockSession()

    renderBoundary()

    expect(screen.getByText('Conteúdo do CRM')).toBeInTheDocument()
    expect(routerMock.replace).not.toHaveBeenCalled()
  })

  it('bloqueia um RENTER e manda pra home, sem derrubar a sessão válida dele', async () => {
    mockSession({ role: 'RENTER' })

    renderBoundary()

    expect(screen.queryByText('Conteúdo do CRM')).not.toBeInTheDocument()
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith('/'))
    expect(clearClientSession).not.toHaveBeenCalled()
  })

  it('bloqueia e redireciona quando não há sessão', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>)

    renderBoundary()

    expect(screen.queryByText('Conteúdo do CRM')).not.toBeInTheDocument()
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith('/login'))
  })
  it('shows temporary unavailability without treating the preserved session as logged out', () => {
    mockSession({ authUnavailable: true, scope: undefined, tenantId: undefined, role: undefined })
    renderBoundary()
    expect(screen.queryByText('Conteúdo do CRM')).not.toBeInTheDocument()
    expect(screen.getByText('Autenticação temporariamente indisponível')).toBeInTheDocument()
    expect(clearClientSession).not.toHaveBeenCalled()
    expect(routerMock.replace).not.toHaveBeenCalled()
  })
})
