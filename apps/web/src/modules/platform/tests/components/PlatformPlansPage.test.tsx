import { ThemeProvider } from '@mui/material'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { PlatformPlansPage } from '../../components/PlatformPlansPage'
import type { ApiPlatformPlan } from '../../types/platform-plan'

const { usePlatformPlans, mutateAsync, enqueueSnackbar } = vi.hoisted(() => ({
  usePlatformPlans: vi.fn(),
  mutateAsync: vi.fn(),
  enqueueSnackbar: vi.fn(),
}))
vi.mock('../../hooks/use-platform-plans', () => ({
  usePlatformPlans,
  useUpdatePlatformPlan: () => ({ mutateAsync, isPending: false }),
}))
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar }) }))

const updatedAt = '2026-10-15T12:00:00.000Z'
const plans: ApiPlatformPlan[] = [
  {
    accountType: 'INDIVIDUAL',
    usageUnit: 'PROPERTIES',
    monthlyPrice: 49.99,
    includedUnits: 10,
    extraUnitPrice: 9.99,
    activeAccounts: 0,
    updatedAt,
  },
  {
    accountType: 'BROKER',
    usageUnit: 'PROPERTIES',
    monthlyPrice: 99.99,
    includedUnits: 10,
    extraUnitPrice: 9.99,
    activeAccounts: 1,
    updatedAt,
  },
  {
    accountType: 'AGENCY',
    usageUnit: 'BROKERS',
    monthlyPrice: 199.99,
    includedUnits: 10,
    extraUnitPrice: 19.99,
    activeAccounts: 4,
    updatedAt,
  },
]

function renderPage() {
  return render(
    <ThemeProvider theme={theme}>
      <PlatformPlansPage />
    </ThemeProvider>,
  )
}

describe('PlatformPlansPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePlatformPlans).mockReturnValue({ data: plans, isPending: false, isError: false })
  })

  it('mostra o preço, o limite e o extra de cada tipo de conta', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Planos' })).toBeVisible()
    const individual = screen.getByRole('region', { name: 'Pessoa física' })
    expect(within(individual).getByText(/R\$\s*49,99/)).toBeVisible()
    expect(within(individual).getByText('Inclui até 10 imóveis')).toBeVisible()
    expect(within(individual).getByText(/R\$\s*9,99 por imóvel extra/)).toBeVisible()
    expect(within(individual).getByText('Nenhuma conta ativa')).toBeVisible()

    expect(
      within(screen.getByRole('region', { name: 'Corretor' })).getByText('1 conta ativa'),
    ).toBeVisible()

    const agency = screen.getByRole('region', { name: 'Imobiliária' })
    expect(within(agency).getByText(/R\$\s*199,99/)).toBeVisible()
    expect(within(agency).getByText('Inclui até 10 corretores ativos')).toBeVisible()
    expect(within(agency).getByText(/R\$\s*19,99 por corretor extra/)).toBeVisible()
    expect(within(agency).getByText('4 contas ativas')).toBeVisible()
  })

  it('edita um plano mostrando o exemplo calculado e envia os valores em número', async () => {
    const user = userEvent.setup()
    mutateAsync.mockResolvedValue({})
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Editar plano Corretor' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByLabelText('Preço mensal')).toHaveValue('99,99')
    expect(
      within(dialog).getByText(/com 12 imóveis, a mensalidade fica R\$\s*119,97/),
    ).toBeVisible()

    await user.clear(within(dialog).getByLabelText('Preço mensal'))
    await user.type(within(dialog).getByLabelText('Preço mensal'), '109,90')
    await user.clear(within(dialog).getByLabelText('Imóveis incluídos'))
    await user.type(within(dialog).getByLabelText('Imóveis incluídos'), '15')
    expect(
      within(dialog).getByText(/com 17 imóveis, a mensalidade fica R\$\s*129,88/),
    ).toBeVisible()
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    expect(mutateAsync).toHaveBeenCalledWith({
      accountType: 'BROKER',
      monthlyPrice: 109.9,
      includedUnits: 15,
      extraUnitPrice: 9.99,
    })
    expect(enqueueSnackbar).toHaveBeenCalledWith('Plano atualizado.', { variant: 'success' })
  })

  it('não salva valores inválidos', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Editar plano Imobiliária' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByLabelText('Corretores ativos incluídos')).toHaveValue('10')
    await user.clear(within(dialog).getByLabelText('Valor por corretor extra'))
    await user.type(within(dialog).getByLabelText('Valor por corretor extra'), '19,999')
    await user.clear(within(dialog).getByLabelText('Corretores ativos incluídos'))
    await user.type(within(dialog).getByLabelText('Corretores ativos incluídos'), '2,5')
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    expect(
      await within(dialog).findByText('Informe um valor válido, com até duas casas decimais.'),
    ).toBeVisible()
    expect(within(dialog).getByText('Informe um número inteiro.')).toBeVisible()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it('mostra carregando e erro sem inventar preços', () => {
    vi.mocked(usePlatformPlans).mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
    })
    const view = renderPage()
    expect(screen.getByRole('progressbar')).toBeVisible()
    view.unmount()

    vi.mocked(usePlatformPlans).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
    })
    renderPage()
    expect(screen.getByText('Não foi possível carregar os planos.')).toBeVisible()
  })
})
