import { ThemeProvider } from '@mui/material'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { PlatformAdminsPage } from '../../components/PlatformAdminsPage'
import type { PlatformAdminAccount } from '../../types/platform-admin'

const { usePlatformAdmins, activate, deactivate, update, enqueueSnackbar, actor } = vi.hoisted(
  () => ({
    usePlatformAdmins: vi.fn(),
    activate: vi.fn(),
    deactivate: vi.fn(),
    update: vi.fn(),
    enqueueSnackbar: vi.fn(),
    actor: { key: 'admin-1:ADMIN', enabled: true, canManage: true },
  }),
)
vi.mock('../../hooks/use-platform-actor', () => ({ usePlatformActor: () => actor }))
vi.mock('../../hooks/use-platform-admins', () => ({
  usePlatformAdmins,
  useActivatePlatformAdmin: () => ({ mutateAsync: activate, isPending: false }),
  useDeactivatePlatformAdmin: () => ({ mutateAsync: deactivate, isPending: false }),
  useUpdatePlatformAdmin: () => ({ mutateAsync: update, isPending: false }),
  useCreatePlatformAdmin: () => ({ mutateAsync: vi.fn(), isError: false, error: null }),
}))
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar }) }))

function admin(overrides: Partial<PlatformAdminAccount>): PlatformAdminAccount {
  return {
    id: 'a1',
    name: 'Ana Admin',
    email: 'ana@ketris.dev',
    role: 'ADMIN',
    active: true,
    createdAt: '2026-01-10T12:00:00.000Z',
    lastAccessAt: '2026-10-27T15:30:00.000Z',
    ...overrides,
  }
}

const admins = [
  admin({}),
  admin({
    id: 'a2',
    name: 'Bruno Agent',
    email: 'bruno@ketris.dev',
    role: 'AGENT',
    active: false,
    lastAccessAt: null,
  }),
]

function renderPage() {
  return render(
    <ThemeProvider theme={theme}>
      <PlatformAdminsPage />
    </ThemeProvider>,
  )
}

function desktopTable() {
  return screen.getByRole('table')
}

describe('PlatformAdminsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    actor.canManage = true
    usePlatformAdmins.mockReturnValue({ data: admins, isLoading: false, isError: false })
  })

  it('mostra datas reais de criação e de último acesso', () => {
    renderPage()

    const ana = within(desktopTable()).getByRole('row', { name: /Ana Admin/ })
    expect(within(ana).getByText('10/01/2026')).toBeVisible()
    expect(within(ana).getByText(/27\/10\/2026/)).toBeVisible()
    const bruno = within(desktopTable()).getByRole('row', { name: /Bruno Agent/ })
    expect(within(bruno).getByText('Nunca acessou')).toBeVisible()
    expect(screen.queryByText('Não disponível')).not.toBeInTheDocument()
  })

  it('filtra por busca, situação e função e limpa os filtros', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Buscar por nome ou e-mail'), 'bruno')
    expect(within(desktopTable()).queryByRole('row', { name: /Ana Admin/ })).toBeNull()

    await user.clear(screen.getByLabelText('Buscar por nome ou e-mail'))
    await user.click(screen.getByRole('combobox', { name: 'Todas as funções' }))
    await user.click(await screen.findByRole('option', { name: 'Admin' }))
    expect(within(desktopTable()).queryByRole('row', { name: /Bruno Agent/ })).toBeNull()

    await user.click(screen.getByRole('combobox', { name: 'Todos os status' }))
    await user.click(await screen.findByRole('option', { name: 'Inativo' }))
    expect(screen.getByText('Nenhum usuário encontrado')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    expect(within(desktopTable()).getAllByRole('row')).toHaveLength(3)
  })

  it('desativa um admin ativo só depois da confirmação', async () => {
    const user = userEvent.setup()
    deactivate.mockResolvedValue(admins[0])
    renderPage()

    await user.click(within(desktopTable()).getByRole('button', { name: 'Ações para Ana Admin' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Desativar' }))
    const dialog = await screen.findByRole('dialog', { name: 'Desativar administrador?' })
    expect(deactivate).not.toHaveBeenCalled()
    await user.click(within(dialog).getByRole('button', { name: 'Desativar' }))

    expect(deactivate).toHaveBeenCalledWith('a1')
    expect(enqueueSnackbar).toHaveBeenCalledWith('Cadastro atualizado com sucesso.', {
      variant: 'success',
    })
  })

  it('reativa um admin inativo direto pelo menu', async () => {
    const user = userEvent.setup()
    activate.mockResolvedValue(admins[1])
    renderPage()

    await user.click(within(desktopTable()).getByRole('button', { name: 'Ações para Bruno Agent' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Ativar' }))

    expect(activate).toHaveBeenCalledWith('a2')
  })

  it('abre a edição já preenchida com os dados do admin', async () => {
    const user = userEvent.setup()
    update.mockResolvedValue(admins[1])
    renderPage()

    await user.click(within(desktopTable()).getByRole('button', { name: 'Ações para Bruno Agent' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Alterar cadastro' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByLabelText('Nome')).toHaveValue('Bruno Agent')
    expect(within(dialog).getByLabelText('E-mail')).toHaveValue('bruno@ketris.dev')

    await user.clear(within(dialog).getByLabelText('Nome'))
    await user.type(within(dialog).getByLabelText('Nome'), 'Bruno Souza')
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    expect(update).toHaveBeenCalledWith({
      id: 'a2',
      name: 'Bruno Souza',
      email: 'bruno@ketris.dev',
      role: 'AGENT',
    })
  })

  it('só deixa o papel ADMIN criar e gerenciar admins', () => {
    actor.canManage = false
    renderPage()

    expect(screen.queryByRole('button', { name: 'Novo administrador' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Ações para/ })).not.toBeInTheDocument()
    expect(within(desktopTable()).getAllByRole('row')).toHaveLength(3)
  })

  it('mostra erro de carregamento sem dados de exemplo', () => {
    usePlatformAdmins.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    renderPage()

    expect(screen.getByText('Não foi possível carregar os administradores.')).toBeVisible()
  })
  it.each(['deactivate', 'edit'] as const)(
    'explains LAST_PLATFORM_ADMIN and keeps the %s dialog open',
    async (mode) => {
      const user = userEvent.setup()
      const error = {
        isAxiosError: true,
        response: { data: { error: { code: 'LAST_PLATFORM_ADMIN' } } },
      }
      if (mode === 'deactivate') deactivate.mockRejectedValueOnce(error)
      else update.mockRejectedValueOnce(error)
      renderPage()
      await user.click(within(desktopTable()).getByRole('button', { name: 'Ações para Ana Admin' }))
      await user.click(
        await screen.findByRole('menuitem', {
          name: mode === 'deactivate' ? 'Desativar' : 'Alterar cadastro',
        }),
      )
      const dialog = await screen.findByRole('dialog')
      await user.click(
        within(dialog).getByRole('button', {
          name: mode === 'deactivate' ? 'Desativar' : 'Salvar',
        }),
      )
      expect(enqueueSnackbar).toHaveBeenCalledWith(
        'Mantenha pelo menos um administrador ativo na plataforma.',
        { variant: 'error' },
      )
      expect(dialog).toBeVisible()
    },
  )
})
