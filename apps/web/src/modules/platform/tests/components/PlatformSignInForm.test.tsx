import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { PlatformSignInForm } from '../../components/PlatformSignInForm'

const { signIn, getSession, signOut, push, refresh } = vi.hoisted(() => ({
  signIn: vi.fn(),
  getSession: vi.fn(),
  signOut: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}))
vi.mock('next-auth/react', () => ({ signIn, getSession, signOut }))
vi.mock('@/i18n/navigation', async () => ({
  ...(await vi.importActual<typeof import('@/i18n/navigation')>('@/i18n/navigation')),
  useRouter: () => ({ push, refresh }),
}))

function renderForm() {
  return render(
    <ThemeProvider theme={theme}>
      <PlatformSignInForm />
    </ThemeProvider>,
  )
}

async function submit(email = 'socia@ketris.dev', password = 'senha-forte-123') {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('E-mail'), email)
  await user.type(screen.getByLabelText('Senha'), password)
  await user.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('PlatformSignInForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('começa vazio, sem credenciais preenchidas', () => {
    renderForm()

    expect(screen.getByLabelText('E-mail')).toHaveValue('')
    expect(screen.getByLabelText('Senha')).toHaveValue('')
    expect(signIn).not.toHaveBeenCalled()
  })

  it('entra na plataforma com uma sessão de platform admin', async () => {
    signIn.mockResolvedValue({ ok: true, error: null })
    getSession.mockResolvedValue({ scope: 'platform' })
    renderForm()

    await submit()

    expect(signIn).toHaveBeenCalledWith('platform-credentials', {
      email: 'socia@ketris.dev',
      password: 'senha-forte-123',
      redirect: false,
    })
    expect(push).toHaveBeenCalledWith('/platform')
  })

  it('avisa credenciais inválidas sem navegar', async () => {
    signIn.mockResolvedValue({ ok: false, error: 'CredentialsSignin' })
    renderForm()

    await submit()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível entrar. Confira o e-mail e a senha.',
    )
    expect(push).not.toHaveBeenCalled()
  })

  it('encerra e bloqueia uma sessão que não é de plataforma', async () => {
    signIn.mockResolvedValue({ ok: true, error: null })
    getSession.mockResolvedValue({ scope: 'tenant' })
    renderForm()

    await submit()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Acesso restrito a administradores da plataforma.',
    )
    expect(signOut).toHaveBeenCalledWith({ redirect: false })
    expect(push).not.toHaveBeenCalled()
  })
})
