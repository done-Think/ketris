import { ThemeProvider } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { AcceptInvitationScreen } from '../../components/AcceptInvitationScreen'

const service = vi.hoisted(() => ({ previewInvitation: vi.fn(), acceptInvitation: vi.fn() }))

vi.mock('../../services/team-service', () => ({ teamService: service }))
vi.mock('@modules/auth/components/AuthShell', () => ({
  AuthShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}))

const preview = {
  name: 'Eva Corretora',
  email: 'eva@ketris.dev',
  agencyName: 'Imobiliária Horizonte',
  status: 'VALID' as const,
}

function renderScreen(token: string | null = 'token-1') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider theme={theme}>
        <AcceptInvitationScreen token={token} />
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => vi.clearAllMocks())

describe('AcceptInvitationScreen', () => {
  it('rejects a missing token without calling the API', () => {
    renderScreen(null)
    expect(
      screen.getByText('Convite não encontrado. Confira o link ou peça um novo convite.'),
    ).toBeVisible()
    expect(service.previewInvitation).not.toHaveBeenCalled()
  })

  it.each([
    ['EXPIRED', 'Este convite expirou. Peça um novo ao responsável pela imobiliária.'],
    ['ACCEPTED', 'Este convite já foi usado. Entre com o seu e-mail e senha.'],
  ])('shows the %s state', async (status, message) => {
    service.previewInvitation.mockResolvedValue({ ...preview, status })
    renderScreen()
    expect(await screen.findByText(message)).toBeVisible()
  })

  it('shows the invalid state when the token is unknown', async () => {
    service.previewInvitation.mockRejectedValue(new Error('not found'))
    renderScreen()
    expect(
      await screen.findByText('Convite não encontrado. Confira o link ou peça um novo convite.'),
    ).toBeVisible()
  })

  it('validates and sets the password of the invited broker', async () => {
    service.previewInvitation.mockResolvedValue(preview)
    service.acceptInvitation.mockResolvedValue({ email: preview.email })
    renderScreen()

    expect(
      await screen.findByText('Defina sua senha para acessar a Imobiliária Horizonte.'),
    ).toBeVisible()
    expect(screen.getByDisplayValue('eva@ketris.dev')).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-forte' } })
    fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: 'outra' } })
    fireEvent.click(screen.getByRole('button', { name: 'Definir senha' }))
    expect(await screen.findByText('As senhas não coincidem')).toBeVisible()

    fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: 'senha-forte' } })
    fireEvent.click(screen.getByRole('button', { name: 'Definir senha' }))

    await waitFor(() =>
      expect(service.acceptInvitation).toHaveBeenCalledWith('token-1', 'senha-forte'),
    )
    expect(
      await screen.findByText('Senha definida! Entre com o seu e-mail e a nova senha.'),
    ).toBeVisible()
    expect(screen.getByRole('link', { name: 'Ir para o login' })).toHaveAttribute('href', '/login')
  })

  it('shows an error when the password could not be set', async () => {
    service.previewInvitation.mockResolvedValue(preview)
    service.acceptInvitation.mockRejectedValue(new Error('boom'))
    renderScreen()
    fireEvent.change(await screen.findByLabelText('Senha'), { target: { value: 'senha-forte' } })
    fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: 'senha-forte' } })
    fireEvent.click(screen.getByRole('button', { name: 'Definir senha' }))
    expect(
      await screen.findByText('Não foi possível definir a senha. Tente novamente.'),
    ).toBeVisible()
  })
})
