import { ThemeProvider } from '@mui/material'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { CreateTenantForm } from '../../components/CreateTenantForm'
import type { ApiPlatformPlan } from '../../types/platform-plan'

const { mutateAsync, enqueueSnackbar, usePlatformPlans } = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  enqueueSnackbar: vi.fn(),
  usePlatformPlans: vi.fn(),
}))
vi.mock('../../hooks/use-tenants', () => ({
  useCreateTenant: () => ({ mutateAsync, isError: false, error: null }),
}))
vi.mock('../../hooks/use-platform-billing', () => ({ usePlatformPlans }))
const actor = vi.hoisted(() => ({ key: 'admin-1:ADMIN', enabled: true, canManage: true }))
vi.mock('../../hooks/use-platform-actor', () => ({ usePlatformActor: () => actor }))
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar }) }))

const updatedAt = '2026-10-15T12:00:00.000Z'
const plans: ApiPlatformPlan[] = [
  {
    accountType: 'INDIVIDUAL',
    usageUnit: 'PROPERTIES',
    monthlyPrice: 49.99,
    includedUnits: 10,
    extraUnitPrice: 9.99,
    activeAccounts: 2,
    createdAt: updatedAt,
    updatedAt,
    updatedBy: null,
  },
  {
    accountType: 'BROKER',
    usageUnit: 'PROPERTIES',
    monthlyPrice: 99.99,
    includedUnits: 10,
    extraUnitPrice: 9.99,
    activeAccounts: 4,
    createdAt: updatedAt,
    updatedAt,
    updatedBy: null,
  },
  {
    accountType: 'AGENCY',
    usageUnit: 'BROKERS',
    monthlyPrice: 199.99,
    includedUnits: 10,
    extraUnitPrice: 19.99,
    activeAccounts: 5,
    createdAt: updatedAt,
    updatedAt,
    updatedBy: null,
  },
]

function renderForm() {
  return render(
    <ThemeProvider theme={theme}>
      <CreateTenantForm />
    </ThemeProvider>,
  )
}

describe('CreateTenantForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    actor.canManage = true
    vi.mocked(usePlatformPlans).mockReturnValue({ data: plans, isPending: false, isError: false })
  })

  it('mostra os tipos de conta com o preço de cada plano, com imobiliária escolhida', () => {
    renderForm()

    const types = screen.getByRole('radiogroup', { name: 'Tipo de conta' })
    expect(within(types).getByRole('radio', { name: /Imobiliária/ })).toBeChecked()
    expect(within(types).getByText(/R\$\s*49,99\/mês/)).toBeVisible()
    expect(within(types).getByText(/R\$\s*99,99\/mês/)).toBeVisible()
    expect(within(types).getByText('Inclui até 10 corretores ativos')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Cancelar' })).toHaveAttribute(
      'href',
      '/platform/tenants',
    )
  })

  it('atualiza o resumo ao vivo com nome, identificador, tipo, situação e mensalidade', async () => {
    const user = userEvent.setup()
    renderForm()
    const summary = screen.getByRole('complementary', { name: 'Resumo' })

    expect(within(summary).getByText('Nome da conta')).toBeVisible()
    expect(within(summary).getByText(/R\$\s*199,99\/mês/)).toBeVisible()

    await user.type(screen.getByLabelText('Nome'), 'Roberto Lima Corretor')
    await user.click(screen.getByRole('radio', { name: /Corretor/ }))
    await user.click(screen.getByRole('checkbox', { name: /Começar em período de teste/ }))

    expect(within(summary).getByText('Roberto Lima Corretor')).toBeVisible()
    expect(within(summary).getByText('roberto-lima-corretor')).toBeVisible()
    expect(within(summary).getByText('RL')).toBeVisible()
    expect(within(summary).getByText(/R\$\s*99,99\/mês/)).toBeVisible()
    expect(within(summary).getByText(/R\$\s*9,99 por imóvel acima de 10/)).toBeVisible()
    expect(within(summary).getByText('Em teste')).toBeVisible()
    expect(within(summary).getByText('Não é cobrada enquanto estiver em teste.')).toBeVisible()
  })

  it('preenche o identificador a partir do nome até ele ser editado à mão', async () => {
    const user = userEvent.setup()
    renderForm()
    const name = screen.getByLabelText('Nome')
    const slug = screen.getByLabelText('Identificador (slug)')

    await user.type(name, 'Imobiliária São João')
    expect(slug).toHaveValue('imobiliaria-sao-joao')

    await user.clear(slug)
    await user.type(slug, 'sao-joao')
    await user.type(name, ' Ltda')
    expect(slug).toHaveValue('sao-joao')

    await user.clear(slug)
    await user.type(name, '!')
    expect(slug).toHaveValue('imobiliaria-sao-joao-ltda')
  })

  it('mostra os erros sem enviar quando os campos estão vazios', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('Informe o nome')).toBeVisible()
    expect(screen.getByText('Informe o slug')).toBeVisible()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it('envia o tipo de conta e a situação inicial escolhidos', async () => {
    const user = userEvent.setup()
    mutateAsync.mockResolvedValue({ id: 'tenant-1', name: 'Fernanda Cavalcanti' })
    renderForm()

    await user.click(screen.getByRole('radio', { name: /Pessoa física/ }))
    await user.type(screen.getByLabelText('Nome'), 'Fernanda Cavalcanti')
    await user.click(screen.getByRole('checkbox', { name: /Começar em período de teste/ }))
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(mutateAsync).toHaveBeenCalledWith({
      name: 'Fernanda Cavalcanti',
      slug: 'fernanda-cavalcanti',
      accountType: 'INDIVIDUAL',
      status: 'TRIAL',
    })
    expect(enqueueSnackbar).toHaveBeenCalledWith('Conta Fernanda Cavalcanti criada com sucesso.', {
      variant: 'success',
    })
  })

  it('cria como imobiliária ativa quando nada é alterado', async () => {
    const user = userEvent.setup()
    mutateAsync.mockResolvedValue({ id: 'tenant-2', name: 'Aurora Imóveis' })
    renderForm()

    await user.type(screen.getByLabelText('Nome'), 'Aurora Imóveis')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(mutateAsync).toHaveBeenCalledWith({
      name: 'Aurora Imóveis',
      slug: 'aurora-imoveis',
      accountType: 'AGENCY',
      status: 'ACTIVE',
    })
  })

  it('funciona sem os preços enquanto os planos carregam', () => {
    vi.mocked(usePlatformPlans).mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
    })
    renderForm()

    expect(screen.getByRole('radio', { name: /Corretor/ })).toBeInTheDocument()
    expect(screen.queryByText(/\/mês/)).not.toBeInTheDocument()
  })

  it('não mostra o formulário para quem não tem o papel ADMIN', () => {
    actor.canManage = false
    renderForm()

    expect(
      screen.getByText('Só administradores com o papel Admin podem criar contas.'),
    ).toBeVisible()
    expect(screen.queryByRole('button', { name: /Criar conta/ })).not.toBeInTheDocument()
  })
})
