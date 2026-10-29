import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { signIn } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LoginForm } from '../../components/LoginForm'
import { authService } from '../../services/auth-service'
import { AuthQueryTestProvider } from '../fixtures/auth-query-provider'

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }))
vi.mock('@/i18n/navigation', async () => ({
  ...(await vi.importActual<typeof import('@/i18n/navigation')>('@/i18n/navigation')),
  useRouter: () => router,
  Link: 'a',
}))
vi.mock('next-auth/react', () => ({ signIn: vi.fn() }))
vi.mock('../../services/auth-service', () => ({ authService: { login: vi.fn() } }))

const tenants = [
  { id: 't1', name: 'Primeira', slug: 'primeira' },
  { id: 't2', name: 'Segunda', slug: 'segunda' },
]
const authenticated = {
  user: {
    id: 'u3',
    tenantId: 't3',
    name: 'Ana',
    email: 'outra@example.test',
    role: 'OWNER' as const,
    active: true,
    pendingApproval: false,
    avatarUrl: null,
    phone: null,
    creci: null,
  },
  accessToken: 'access-fake',
  refreshToken: 'refresh-fake',
}

describe('seleção de imobiliária vinculada às credenciais do formulário', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(signIn).mockResolvedValue({ error: null, status: 200, ok: true, url: null })
    vi.mocked(authService.login)
      .mockResolvedValueOnce({ outcome: 'SELECT_TENANT', tenants })
      .mockResolvedValue(authenticated)
  })
  it.each(['email', 'password'] as const)(
    'limpa a seleção ao alterar %s e revalida as novas credenciais',
    async (field) => {
      const user = userEvent.setup()
      render(
        <AuthQueryTestProvider>
          <LoginForm callbackUrl="/dashboard" />
        </AuthQueryTestProvider>,
      )
      await user.type(screen.getByLabelText('E-mail'), 'ana@example.test')
      await user.type(screen.getByLabelText('Senha'), 'senha-original')
      await user.click(screen.getByRole('button', { name: 'Entrar' }))
      await user.click(await screen.findByRole('combobox', { name: 'Conta / imobiliária' }))
      await user.click(screen.getByRole('option', { name: 'Segunda' }))
      const input = screen.getByLabelText(field === 'email' ? 'E-mail' : 'Senha')
      await user.clear(input)
      await user.type(input, field === 'email' ? 'outra@example.test' : 'senha-outra')
      expect(
        screen.queryByRole('combobox', { name: 'Conta / imobiliária' }),
      ).not.toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Entrar' }))
      await waitFor(() => expect(authService.login).toHaveBeenCalledTimes(2))
      const payload = vi.mocked(authService.login).mock.calls[1][0]
      expect(payload.tenantId).toBeFalsy()
      expect(payload[field]).toBe(field === 'email' ? 'outra@example.test' : 'senha-outra')
      expect(router.replace).toHaveBeenCalledWith('/dashboard')
    },
  )
  it('pede nova seleção quando as credenciais atualizadas também pertencem a várias contas', async () => {
    vi.mocked(authService.login)
      .mockReset()
      .mockResolvedValueOnce({ outcome: 'SELECT_TENANT', tenants })
      .mockResolvedValueOnce({
        outcome: 'SELECT_TENANT',
        tenants: [
          { id: 't3', name: 'Terceira', slug: 'terceira' },
          { id: 't4', name: 'Quarta', slug: 'quarta' },
        ],
      })
      .mockResolvedValue(authenticated)
    const user = userEvent.setup()
    render(
      <AuthQueryTestProvider>
        <LoginForm callbackUrl="/dashboard" />
      </AuthQueryTestProvider>,
    )
    await user.type(screen.getByLabelText('E-mail'), 'ana@example.test')
    await user.type(screen.getByLabelText('Senha'), 'senha-original')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    await user.click(await screen.findByRole('combobox', { name: 'Conta / imobiliária' }))
    await user.click(screen.getByRole('option', { name: 'Segunda' }))
    await user.clear(screen.getByLabelText('E-mail'))
    await user.type(screen.getByLabelText('E-mail'), 'outra@example.test')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    await screen.findByRole('combobox', { name: 'Conta / imobiliária' })
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeDisabled()
    expect(signIn).not.toHaveBeenCalled()
    await user.click(screen.getByRole('combobox', { name: 'Conta / imobiliária' }))
    expect(screen.queryByRole('option', { name: 'Segunda' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('option', { name: 'Terceira' }))
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    await waitFor(() => expect(authService.login).toHaveBeenCalledTimes(3))
    expect(vi.mocked(authService.login).mock.calls[2][0]).toMatchObject({
      email: 'outra@example.test',
      tenantId: 't3',
    })
  })
})
