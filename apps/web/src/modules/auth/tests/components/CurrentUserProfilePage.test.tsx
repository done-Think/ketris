import { ThemeProvider } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'
import { CurrentUserProfilePage } from '../../components/CurrentUserProfilePage'
import { authQueryKeys } from '../../config/auth-query-keys'
import { userService } from '../../services/user-service'
import type { TenantUser } from '../../types/user'

const { updateSession, enqueueSnackbar, signOut, replace } = vi.hoisted(() => ({
  updateSession: vi.fn(),
  enqueueSnackbar: vi.fn(),
  signOut: vi.fn(),
  replace: vi.fn(),
}))
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      tenantId: 'tenant-1',
      role: 'AGENT',
      user: { id: 'current-user', name: 'Stale session', email: 'stale@example.com' },
    },
    update: updateSession,
  }),
  signOut,
}))
vi.mock('@/i18n/navigation', async () => ({
  ...(await vi.importActual<typeof import('@/i18n/navigation')>('@/i18n/navigation')),
  useRouter: () => ({ replace }),
}))
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar }) }))
vi.mock('../../services/user-service', () => ({
  userService: {
    get: vi.fn(),
    update: vi.fn(),
    uploadAvatar: vi.fn(),
    changeOwnPassword: vi.fn(),
    requestEmailChange: vi.fn(),
    confirmEmailChange: vi.fn(),
  },
}))
const scope = { tenantId: 'tenant-1', userId: 'current-user', role: 'AGENT' as const }
const profile: TenantUser = {
  id: scope.userId,
  tenantId: scope.tenantId,
  name: 'Ana',
  email: 'ana@example.com',
  phone: '(35) 98888-7777',
  creci: '12345',
  avatarUrl: '/avatar.png',
  role: 'AGENT',
  active: true,
  pendingApproval: false,
}
async function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={client}>
        <CurrentUserProfilePage />
      </QueryClientProvider>
    </ThemeProvider>,
  )
  await screen.findByRole('textbox', { name: 'Nome' })
  return client
}

describe('CurrentUserProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(userService.get).mockResolvedValue(profile)
    updateSession.mockResolvedValue(undefined)
  })
  it('loads the real profile including phone and CRECI rather than session data', async () => {
    await renderPage()
    expect(userService.get).toHaveBeenCalledWith('current-user')
    expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveValue('Ana')
    expect(screen.getByRole('textbox', { name: 'Telefone' })).toHaveValue('(35) 98888-7777')
    expect(screen.getByRole('textbox', { name: 'CRECI' })).toHaveValue('12345')
    expect(screen.getByRole('textbox', { name: 'E-mail' })).toHaveAttribute('readonly')
    expect(screen.getByLabelText('Senha atual')).toHaveValue('')
  })
  it('saves phone and CRECI and refreshes the session without changing email directly', async () => {
    vi.mocked(userService.update).mockResolvedValue({
      ...profile,
      name: 'Beatriz',
      phone: '(35) 97777-6666',
      creci: '67890',
    })
    await renderPage()
    fireEvent.change(screen.getByRole('textbox', { name: 'Nome' }), {
      target: { value: 'Beatriz' },
    })
    fireEvent.input(screen.getByRole('textbox', { name: 'Telefone' }), {
      target: { value: '35977776666' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'CRECI' }), { target: { value: '67890' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    await waitFor(() =>
      expect(userService.update).toHaveBeenCalledWith('current-user', {
        name: 'Beatriz',
        phone: '(35) 97777-6666',
        creci: '67890',
        avatarUrl: '/avatar.png',
      }),
    )
    expect(updateSession).toHaveBeenCalledWith()
  })
  it('preserves local edits during refetch and resets only on cancel', async () => {
    const client = await renderPage()
    fireEvent.change(screen.getByRole('textbox', { name: 'Nome' }), {
      target: { value: 'Unsaved' },
    })
    await act(async () => {
      client.setQueryData(authQueryKeys.currentUser(scope), { ...profile, name: 'Server update' })
    })
    await screen.findByRole('img', { name: 'Server update' })
    expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveValue('Unsaved')
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveValue('Server update')
  })
  it('validates required fields before saving and preserves data on server failure', async () => {
    vi.mocked(userService.update).mockRejectedValue(new Error('network'))
    await renderPage()
    fireEvent.change(screen.getByRole('textbox', { name: 'CRECI' }), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    expect(await screen.findByText('Informe seu CRECI.')).toBeVisible()
    expect(userService.update).not.toHaveBeenCalled()
    fireEvent.change(screen.getByRole('textbox', { name: 'CRECI' }), { target: { value: '12345' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Nome' }), {
      target: { value: 'Unsaved' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    expect(
      await screen.findByText('Não foi possível salvar as alterações. Tente novamente.'),
    ).toBeVisible()
    expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveValue('Unsaved')
    expect(enqueueSnackbar).not.toHaveBeenCalled()
  })
  it('changes only the current password and clears fields after saving', async () => {
    vi.mocked(userService.changeOwnPassword).mockResolvedValue(undefined)
    await renderPage()
    fireEvent.change(screen.getByLabelText('Senha atual'), { target: { value: 'old-password' } })
    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'new-password' } })
    fireEvent.change(screen.getByLabelText('Confirmar nova senha'), {
      target: { value: 'new-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Alterar senha' }))
    await waitFor(() =>
      expect(userService.changeOwnPassword).toHaveBeenCalledWith('old-password', 'new-password'),
    )
    await waitFor(() => expect(screen.getByLabelText('Nova senha')).toHaveValue(''))
  })
  it('shows the current-password error and retains entered values', async () => {
    vi.mocked(userService.changeOwnPassword).mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: { code: 'INVALID_CURRENT_PASSWORD' } } },
    })
    await renderPage()
    fireEvent.change(screen.getByLabelText('Senha atual'), { target: { value: 'wrong-password' } })
    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'new-password' } })
    fireEvent.change(screen.getByLabelText('Confirmar nova senha'), {
      target: { value: 'new-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Alterar senha' }))
    expect(await screen.findByText('Senha atual incorreta.')).toBeVisible()
    expect(screen.getByLabelText('Nova senha')).toHaveValue('new-password')
  })
  it('requires the new-email code before clearing the session and returning to login', async () => {
    vi.mocked(userService.requestEmailChange).mockResolvedValue(undefined)
    vi.mocked(userService.confirmEmailChange).mockResolvedValue(undefined)
    signOut.mockResolvedValue(undefined)
    await renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Alterar e-mail' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Novo e-mail' }), {
      target: { value: 'new@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar código' }))
    await screen.findByText('Enviamos um código para new@example.com. Ele é válido por 10 minutos.')
    expect(userService.requestEmailChange).toHaveBeenCalledWith('new@example.com', 'pt-BR')
    expect(signOut).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox', { name: 'E-mail', hidden: true })).toHaveValue(
      'ana@example.com',
    )
    fireEvent.change(screen.getAllByRole('textbox', { name: /Código de confirmação/ })[0], {
      target: { value: '123456' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar e entrar novamente' }))
    await waitFor(() =>
      expect(userService.confirmEmailChange).toHaveBeenCalledWith('new@example.com', '123456'),
    )
    expect(signOut).toHaveBeenCalledWith({ redirect: false })
    expect(replace).toHaveBeenCalledWith('/login')
  })
  it('keeps the old email and session when confirmation fails', async () => {
    vi.mocked(userService.requestEmailChange).mockResolvedValue(undefined)
    vi.mocked(userService.confirmEmailChange).mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: { code: 'INVALID_EMAIL_VERIFICATION_CODE' } } },
    })
    await renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Alterar e-mail' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Novo e-mail' }), {
      target: { value: 'new@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar código' }))
    await screen.findByText('Enviamos um código para new@example.com. Ele é válido por 10 minutos.')
    fireEvent.change(screen.getAllByRole('textbox', { name: /Código de confirmação/ })[0], {
      target: { value: '123456' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar e entrar novamente' }))
    expect(await screen.findByText('Código inválido ou expirado.')).toBeVisible()
    expect(screen.getByRole('textbox', { name: 'E-mail', hidden: true })).toHaveValue(
      'ana@example.com',
    )
    expect(signOut).not.toHaveBeenCalled()
    expect(userService.update).not.toHaveBeenCalled()
  })

  it('shows avatar validation errors through the profile form without uploading invalid files', async () => {
    await renderPage()
    const input = document.querySelector('input[type="file"]')!
    fireEvent.change(input, {
      target: { files: [new File(['text'], 'avatar.txt', { type: 'text/plain' })] },
    })
    expect(await screen.findByText('Use uma imagem JPG, PNG ou WEBP.')).toBeVisible()
    expect(userService.uploadAvatar).not.toHaveBeenCalled()
  })
})
