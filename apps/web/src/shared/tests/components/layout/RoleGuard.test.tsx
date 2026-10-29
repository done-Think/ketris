import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RoleGuard } from '../../../components/layout/RoleGuard'

const routerMock = { replace: vi.fn(), refresh: vi.fn() }

vi.mock('@/i18n/navigation', async () => ({
  ...(await vi.importActual<typeof import('@/i18n/navigation')>('@/i18n/navigation')),
  useRouter: () => routerMock,
}))

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

function mockSession(role: string) {
  vi.mocked(useSession).mockReturnValue({
    data: { scope: 'tenant', tenantId: 't1', role },
    status: 'authenticated',
    update: vi.fn(),
  } as unknown as ReturnType<typeof useSession>)
}

function renderGuard() {
  return render(
    <RoleGuard allowedRoles={['OWNER']}>
      <div>Conteúdo restrito</div>
    </RoleGuard>,
  )
}

describe('RoleGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza o conteúdo quando o papel da sessão está na lista permitida', () => {
    mockSession('OWNER')

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
  it('does not mount new protected content or redirect when authentication is unavailable', () => {
    vi.mocked(useSession).mockReturnValue({
      data: { authUnavailable: true },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>)
    renderGuard()
    expect(screen.queryByText('Conteúdo restrito')).not.toBeInTheDocument()
    expect(screen.getByText('Autenticação temporariamente indisponível')).toBeInTheDocument()
    expect(routerMock.replace).not.toHaveBeenCalled()
  })

  it('keeps an existing draft mounted but inert during an outage and restores it after revalidation', () => {
    mockSession('OWNER')
    const view = (
      <RoleGuard allowedRoles={['OWNER']}>
        <input aria-label="Draft" defaultValue="initial" />
      </RoleGuard>
    )
    const { rerender } = render(view)
    const input = screen.getByLabelText('Draft')
    fireEvent.change(input, { target: { value: 'unsaved draft' } })
    vi.mocked(useSession).mockReturnValue({
      data: { authUnavailable: true },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>)
    rerender(
      <RoleGuard allowedRoles={['OWNER']}>
        <input aria-label="Draft" defaultValue="initial" />
      </RoleGuard>,
    )
    expect(input).toBeInTheDocument()
    expect(input.closest('[inert]')).not.toBeNull()
    expect(input).toHaveValue('unsaved draft')
    expect(routerMock.replace).not.toHaveBeenCalled()
    mockSession('OWNER')
    rerender(
      <RoleGuard allowedRoles={['OWNER']}>
        <input aria-label="Draft" defaultValue="initial" />
      </RoleGuard>,
    )
    expect(screen.getByLabelText('Draft')).toBe(input)
    expect(input.closest('[inert]')).toBeNull()
    expect(input).toHaveValue('unsaved draft')
  })
})
