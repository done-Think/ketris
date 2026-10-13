import { ThemeProvider } from '@mui/material'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { CurrentUserProfilePage } from '../../components/CurrentUserProfilePage'
import { userService } from '../../services/user-service'

const updateSession = vi.fn().mockResolvedValue(undefined)
const enqueueSnackbar = vi.fn()

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: { id: 'current-user', name: 'Ana', email: 'ana@example.com', image: '/avatar.png' },
    },
    update: updateSession,
  }),
}))
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar }) }))
vi.mock('../../services/user-service', () => ({
  userService: { update: vi.fn(), uploadAvatar: vi.fn(), changeOwnPassword: vi.fn() },
}))

function renderPage() {
  return render(
    <ThemeProvider theme={theme}>
      <CurrentUserProfilePage />
    </ThemeProvider>,
  )
}

describe('CurrentUserProfilePage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows only the authenticated user data and empty password fields', () => {
    renderPage()

    expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveValue('Ana')
    expect(screen.getByRole('textbox', { name: 'Telefone' })).toHaveValue('(35) 99999-9999')
    expect(screen.getByRole('textbox', { name: 'E-mail' })).toHaveValue('ana@example.com')
    expect(screen.getByRole('img', { name: 'Ana' })).toHaveAttribute('src', '/avatar.png')
    expect(screen.getByLabelText('Nova senha')).toHaveValue('')
    expect(screen.getByLabelText('Confirmar nova senha')).toHaveValue('')
    expect(screen.queryByLabelText(/senha atual/i)).not.toBeInTheDocument()
  })

  it('allows editing the demonstration phone without sending it to the API', async () => {
    vi.mocked(userService.update).mockResolvedValue({
      id: 'current-user',
      tenantId: 'tenant-1',
      name: 'Ana',
      email: 'ana@example.com',
      avatarUrl: '/avatar.png',
      role: 'ADMIN',
      active: true,
      pendingApproval: false,
    })
    renderPage()

    fireEvent.change(screen.getByRole('textbox', { name: 'Telefone' }), {
      target: { value: '35988887777' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() =>
      expect(userService.update).toHaveBeenCalledWith('current-user', {
        name: 'Ana',
        email: 'ana@example.com',
        avatarUrl: '/avatar.png',
      }),
    )
  })

  it('saves profile changes using the current session id and refreshes the session', async () => {
    vi.mocked(userService.update).mockResolvedValue({
      id: 'current-user',
      tenantId: 'tenant-1',
      name: 'Beatriz',
      email: 'bea@example.com',
      avatarUrl: '/avatar.png',
      role: 'ADMIN',
      active: true,
      pendingApproval: false,
    })
    renderPage()

    fireEvent.change(screen.getByRole('textbox', { name: 'Nome' }), {
      target: { value: 'Beatriz' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'E-mail' }), {
      target: { value: 'bea@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() =>
      expect(userService.update).toHaveBeenCalledWith('current-user', {
        name: 'Beatriz',
        email: 'bea@example.com',
        avatarUrl: '/avatar.png',
      }),
    )
    await waitFor(() =>
      expect(updateSession).toHaveBeenCalledWith(
        expect.objectContaining({ user: expect.objectContaining({ name: 'Beatriz' }) }),
      ),
    )
  })

  it('blocks invalid profile fields before calling the API', async () => {
    renderPage()
    fireEvent.change(screen.getByRole('textbox', { name: 'Nome' }), { target: { value: '' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'E-mail' }), {
      target: { value: 'invalid' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() => expect(screen.getByText('Informe seu nome.')).toBeVisible())
    expect(userService.update).not.toHaveBeenCalled()
  })

  it('does not report success when profile update fails', async () => {
    vi.mocked(userService.update).mockRejectedValue(new Error('network'))
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() =>
      expect(
        screen.getByText('Não foi possível salvar as alterações. Tente novamente.'),
      ).toBeVisible(),
    )
    expect(updateSession).not.toHaveBeenCalled()
    expect(enqueueSnackbar).not.toHaveBeenCalled()
  })

  it('validates matching passwords and changes only the current user password', async () => {
    vi.mocked(userService.changeOwnPassword).mockResolvedValue(undefined)
    renderPage()

    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'nova-senha-123' } })
    fireEvent.change(screen.getByLabelText('Confirmar nova senha'), {
      target: { value: 'diferente-123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Alterar senha' }))
    await waitFor(() => expect(screen.getByText('As senhas não coincidem')).toBeVisible())
    expect(userService.changeOwnPassword).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Confirmar nova senha'), {
      target: { value: 'nova-senha-123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Alterar senha' }))
    await waitFor(() =>
      expect(userService.changeOwnPassword).toHaveBeenCalledWith('nova-senha-123'),
    )
    await waitFor(() => expect(screen.getByLabelText('Nova senha')).toHaveValue(''))
  })

  it('preserves the password form and shows an error if the request fails', async () => {
    vi.mocked(userService.changeOwnPassword).mockRejectedValue(new Error('network'))
    renderPage()
    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'nova-senha-123' } })
    fireEvent.change(screen.getByLabelText('Confirmar nova senha'), {
      target: { value: 'nova-senha-123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Alterar senha' }))

    await waitFor(() =>
      expect(screen.getByText('Não foi possível alterar a senha. Tente novamente.')).toBeVisible(),
    )
    expect(screen.getByLabelText('Nova senha')).toHaveValue('nova-senha-123')
    expect(enqueueSnackbar).not.toHaveBeenCalled()
  })
})
