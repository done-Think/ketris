import { render, screen, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clearClientSession } from '@shared/lib/auth/clear-client-session'

import { CrmAccessBoundary } from '../../components/CrmAccessBoundary'

const routerMock = { replace: vi.fn(), refresh: vi.fn() }

vi.mock('@/i18n/navigation', async () => {
  const React = await import('react')

  return {
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
    data: { scope: 'tenant', tenantId: 't1', papel: 'AGENT', ...overrides },
    status: 'authenticated',
    update: vi.fn(),
  } as unknown as ReturnType<typeof useSession>)
}

function renderBoundary() {
  return render(
    <CrmAccessBoundary>
      <div>Conteúdo do CRM</div>
    </CrmAccessBoundary>,
  )
}

describe('CrmAccessBoundary', () => {
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
    mockSession({ papel: 'RENTER' })

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
})
