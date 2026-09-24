import { render, screen, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RoleGuard } from './RoleGuard'

const routerMock = { replace: vi.fn(), refresh: vi.fn() }

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => routerMock,
}))

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

function mockSession(papel: string) {
  vi.mocked(useSession).mockReturnValue({
    data: { scope: 'tenant', tenantId: 't1', papel },
    status: 'authenticated',
    update: vi.fn(),
  } as unknown as ReturnType<typeof useSession>)
}

function renderGuard() {
  return render(
    <RoleGuard allowedRoles={['ADMIN', 'OWNER']}>
      <div>Conteúdo restrito</div>
    </RoleGuard>,
  )
}

describe('RoleGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza o conteúdo quando o papel da sessão está na lista permitida', () => {
    mockSession('ADMIN')

    renderGuard()

    expect(screen.getByText('Conteúdo restrito')).toBeInTheDocument()
    expect(routerMock.replace).not.toHaveBeenCalled()
  })

  it('bloqueia e redireciona pro dashboard quando o papel não está na lista permitida', async () => {
    mockSession('AGENT')

    renderGuard()

    expect(screen.queryByText('Conteúdo restrito')).not.toBeInTheDocument()
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith('/dashboard'))
  })

  it('bloqueia e redireciona quando não há sessão autenticada', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>)

    renderGuard()

    expect(screen.queryByText('Conteúdo restrito')).not.toBeInTheDocument()
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith('/dashboard'))
  })

  it('não redireciona enquanto a sessão ainda está carregando', () => {
    vi.mocked(useSession).mockReturnValue({
      data: undefined,
      status: 'loading',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>)

    renderGuard()

    expect(screen.queryByText('Conteúdo restrito')).not.toBeInTheDocument()
    expect(routerMock.replace).not.toHaveBeenCalled()
  })
})
