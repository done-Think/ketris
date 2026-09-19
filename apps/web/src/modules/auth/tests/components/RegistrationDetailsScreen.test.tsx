import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { signIn } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RegistrationDetailsScreen } from '../../components/RegistrationDetailsScreen'

const routerMock = { replace: vi.fn(), refresh: vi.fn() }

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}))

function mockResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response
}

function renderScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <RegistrationDetailsScreen profile="corretor" />
    </QueryClientProvider>,
  )
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Nome completo/), 'Corretor Teste')
  await user.type(screen.getByLabelText(/E-mail/), 'corretor@ketris.dev')
  await user.type(screen.getByLabelText(/Telefone/), '11999999999')
  await user.type(screen.getByLabelText(/^Senha/), 'senha-longa-123')
  await user.type(screen.getByPlaceholderText('Confirme a senha'), 'senha-longa-123')
  await user.type(screen.getByLabelText(/CRECI/), '00000-F')
  await user.click(screen.getByRole('checkbox', { name: /Li e aceito/ }))
  await user.click(screen.getByRole('button', { name: 'Criar conta' }))
}

describe('RegistrationDetailsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('troca pra tela de confirmação quando o cadastro fica pendente de aprovação', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          mockResponse(202, { outcome: 'PENDING_APPROVAL', email: 'corretor@ketris.dev' }),
        ),
    )

    renderScreen()
    await fillAndSubmit(user)

    expect(await screen.findByText('Cadastro enviado!')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Criar conta' })).not.toBeInTheDocument()
  }, 20000)

  it('pede confirmação de e-mail antes de redirecionar quando o cadastro é concluído', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockResponse(201, {
          outcome: 'REGISTERED',
          user: { role: 'ADMIN' },
          accessToken: 'access-fake',
          refreshToken: 'refresh-fake',
        }),
      ),
    )
    vi.mocked(signIn).mockResolvedValue({ error: null, ok: true, status: 200, url: null })

    renderScreen()
    await fillAndSubmit(user)

    expect(await screen.findByText('Confirme seu e-mail')).toBeInTheDocument()
    expect(routerMock.replace).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText(/Código de verificação/), '123456')
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(routerMock.replace).toHaveBeenCalledWith('/pt/dashboard')
  }, 20000)

  it('mostra a mensagem de erro sem trocar de tela quando o cadastro falha', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(mockResponse(409, { error: { code: 'EMAIL_ALREADY_IN_USE' } })),
    )

    renderScreen()
    await fillAndSubmit(user)

    expect(await screen.findByText('Já existe uma conta com este e-mail.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Criar conta' })).toBeInTheDocument()
    expect(signIn).not.toHaveBeenCalled()
  }, 20000)
})
