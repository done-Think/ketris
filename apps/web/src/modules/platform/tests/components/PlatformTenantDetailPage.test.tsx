import { ThemeProvider } from '@mui/material'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, type AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { PlatformTenantDetailPage } from '../../components/PlatformTenantDetailPage'
import type { PlatformTenant, TenantUser } from '../../types/tenant'

const { useTenant, useTenantUsers, createAdmin, enqueueSnackbar, actor } = vi.hoisted(() => ({
  useTenant: vi.fn(),
  actor: { key: 'admin-1:ADMIN', enabled: true, canManage: true },
  useTenantUsers: vi.fn(),
  createAdmin: vi.fn(),
  enqueueSnackbar: vi.fn(),
}))
vi.mock('../../hooks/use-platform-actor', () => ({ usePlatformActor: () => actor }))
vi.mock('../../hooks/use-tenants', () => ({
  useTenant,
  useTenantUsers,
  useCreateTenantAdmin: () => ({ mutateAsync: createAdmin, isError: false, error: null }),
  useUpdateTenantAccount: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar }) }))

const tenant: PlatformTenant = {
  id: 'roberto',
  name: 'Roberto Lima Corretor',
  slug: 'corretor-autonomo-roberto-lima',
  accountType: 'BROKER',
  status: 'ACTIVE',
  canceledAt: null,
  createdAt: '2026-10-09T12:00:00.000Z',
  monthlyCharge: {
    usageUnit: 'PROPERTIES',
    usage: 12,
    includedUnits: 10,
    extraUnits: 2,
    basePrice: 99.99,
    extraAmount: 19.98,
    total: 119.97,
  },
}

const user = (overrides: Partial<TenantUser>): TenantUser => ({
  id: 'u1',
  tenantId: 'roberto',
  name: 'Roberto Lima',
  email: 'roberto@ketris.dev',
  avatarUrl: null,
  phone: null,
  creci: null,
  role: 'OWNER',
  active: true,
  pendingApproval: false,
  ...overrides,
})

function renderPage(tenantId = 'roberto') {
  return render(
    <ThemeProvider theme={theme}>
      <PlatformTenantDetailPage tenantId={tenantId} />
    </ThemeProvider>,
  )
}

function usersPage(users: TenantUser[]) {
  return { users, totalCount: users.length, page: 1, pageSize: 20 }
}

describe('PlatformTenantDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    actor.canManage = true
    vi.mocked(useTenant).mockReturnValue({
      data: tenant,
      isPending: false,
      isError: false,
      error: null,
    })
    vi.mocked(useTenantUsers).mockReturnValue({
      data: usersPage([]),
      isPending: false,
      isError: false,
    })
  })

  it('mostra de quem é a página: nome, identificador, tipo e situação', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Roberto Lima Corretor', level: 1 })).toBeVisible()
    expect(screen.getByText('corretor-autonomo-roberto-lima')).toBeVisible()
    expect(screen.getByText('RL')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Voltar para Tenants' })).toHaveAttribute(
      'href',
      '/platform/tenants',
    )
  })

  it('resume a conta com mensalidade, extras e uso do plano', () => {
    renderPage()

    const account = screen.getByRole('region', { name: 'Conta' })
    expect(within(account).getByText('Corretor')).toBeVisible()
    expect(within(account).getByText('Ativa')).toBeVisible()
    expect(within(account).getByText(/^R\$\s*119,97$/)).toBeVisible()
    expect(within(account).getByText(/R\$\s*99,99 \+ 2 imóveis extras/)).toBeVisible()
    expect(within(account).getByText('12 de 10 imóveis')).toBeVisible()
  })

  it('explica o próximo passo quando ainda não há usuários', () => {
    renderPage()

    const users = screen.getByRole('region', { name: /Usuários/ })
    expect(within(users).getByText('Nenhum usuário ainda')).toBeVisible()
    expect(within(users).getByText(/Cadastre o administrador ao lado/)).toBeVisible()
  })

  it('lista os usuários com o papel traduzido e quem aguarda aprovação', () => {
    vi.mocked(useTenantUsers).mockReturnValue({
      data: usersPage([
        user({ id: 'u1', name: 'Roberto Lima', role: 'OWNER' }),
        user({
          id: 'u2',
          name: 'Ana Souza',
          email: 'ana@ketris.dev',
          role: 'AGENT',
          pendingApproval: true,
        }),
      ]),
      isPending: false,
      isError: false,
    })
    renderPage()

    const users = screen.getByRole('region', { name: /Usuários/ })
    expect(within(users).getByText('2')).toBeVisible()
    const roberto = within(users).getByRole('row', { name: /Roberto Lima/ })
    expect(within(roberto).getByText('Dono da imobiliária')).toBeVisible()
    expect(within(roberto).getByText('Ativo')).toBeVisible()
    const ana = within(users).getByRole('row', { name: /Ana Souza/ })
    expect(within(ana).getByText('Corretor')).toBeVisible()
    expect(within(ana).getByText('Aguardando aprovação')).toBeVisible()
  })

  it('abre a edição da conta pelo cabeçalho', async () => {
    const userEvents = userEvent.setup()
    renderPage()

    await userEvents.click(screen.getByRole('button', { name: 'Editar conta' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Conta e cobrança')).toBeVisible()
    expect(within(dialog).getByRole('combobox', { name: 'Tipo de conta' })).toHaveTextContent(
      'Corretor',
    )
  })

  it('cria o administrador com a senha visível sob demanda', async () => {
    const userEvents = userEvent.setup()
    createAdmin.mockResolvedValue({ email: 'admin@ketris.dev' })
    renderPage()
    const form = screen.getByRole('region', { name: 'Novo administrador' })

    expect(within(form).getByText('Mínimo de 8 caracteres.')).toBeVisible()
    const password = within(form).getByLabelText('Senha')
    expect(password).toHaveAttribute('type', 'password')
    await userEvents.click(within(form).getByRole('button', { name: 'Mostrar senha' }))
    expect(password).toHaveAttribute('type', 'text')

    await userEvents.type(within(form).getByLabelText('Nome'), 'Admin Roberto')
    await userEvents.type(within(form).getByLabelText('E-mail'), 'admin@ketris.dev')
    await userEvents.type(password, 'senha-segura')
    await userEvents.type(within(form).getByLabelText('Confirmar senha'), 'senha-segura')
    await userEvents.click(within(form).getByRole('button', { name: 'Criar administrador' }))

    expect(createAdmin).toHaveBeenCalledWith({
      tenantId: 'roberto',
      name: 'Admin Roberto',
      email: 'admin@ketris.dev',
      password: 'senha-segura',
    })
    expect(enqueueSnackbar).toHaveBeenCalledWith(
      'Administrador admin@ketris.dev criado com sucesso.',
      {
        variant: 'success',
      },
    )
  })

  it('informa quando a conta não existe', () => {
    vi.mocked(useTenant).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new AxiosError('Not found', '404', undefined, undefined, {
        status: 404,
      } as AxiosResponse),
    })
    renderPage('inexistente')

    expect(screen.getByRole('heading', { name: 'Conta não encontrada.' })).toBeVisible()
  })

  it('mostra erro de carregamento quando a busca falha por outro motivo', () => {
    vi.mocked(useTenant).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new Error('offline'),
    })
    renderPage()

    expect(screen.getByRole('heading', { name: /Não foi possível/ })).toBeVisible()
  })

  it('esconde a edição da conta e a criação de admin para quem não é ADMIN', () => {
    actor.canManage = false
    renderPage()

    expect(screen.queryByRole('button', { name: 'Editar conta' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: /Novo administrador/ })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: /Usuários/ })).toBeVisible()
  })

  it('pagina os usuários pelo total do servidor', () => {
    vi.mocked(useTenantUsers).mockReturnValue({
      data: {
        ...usersPage([user({ id: 'u1', name: 'Roberto Lima', role: 'OWNER' })]),
        totalCount: 45,
      },
      isPending: false,
      isError: false,
    })
    renderPage()

    const users = screen.getByRole('region', { name: /Usuários/ })
    expect(within(users).getByText('45')).toBeVisible()
    expect(within(users).getByText('1-20 de 45')).toBeVisible()
  })
})
