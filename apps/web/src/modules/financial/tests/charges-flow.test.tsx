import { fireEvent, render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '@mui/material'
import { theme } from '@shared/theme/theme'
import { ChargesPage } from '../components/ChargesPage'
import { ChargeDetailsPage } from '../components/ChargeDetailsPage'
import { useChargesStore } from '../stores/charges-store'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('@/i18n/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: vi.fn() }) }))
vi.mock('next-intl', async () => {
  const actual = await vi.importActual<typeof import('next-intl')>('next-intl')
  const { default: charges } = await import('@/i18n/messages/pt-BR/charges.json')
  return {
    ...actual,
    useLocale: () => 'pt-BR',
    useTranslations: (
      namespace?:
        | 'charges'
        | 'charges.details'
        | 'charges.statuses'
        | 'charges.createDialog'
        | 'charges.editDialog'
        | 'charges.archiveDialog',
    ) => actual.createTranslator({ locale: 'pt-BR', messages: { charges }, namespace }),
  }
})

const wrap = (node: React.ReactNode) => <ThemeProvider theme={theme}>{node}</ThemeProvider>
const detail = (id: string) => wrap(<ChargeDetailsPage chargeId={id} />)
beforeEach(() => {
  useChargesStore.setState(useChargesStore.getInitialState(), true)
  vi.clearAllMocks()
})

describe('charges interactions', () => {
  it('renders six rows, paginates, searches, filters status and switches direction', async () => {
    const user = userEvent.setup()
    render(wrap(<ChargesPage />))
    expect(screen.getAllByRole('row')).toHaveLength(7)
    await user.click(screen.getByRole('button', { name: /page 2/i }))
    expect(screen.getByText('Lucas Almeida')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Pendente 2' }))
    expect(screen.getAllByRole('row')).toHaveLength(3)
    await user.type(
      screen.getByRole('textbox', { name: 'Buscar locatário ou imóvel...' }),
      'Mariana',
    )
    expect(screen.queryByText('Lucas Almeida')).not.toBeInTheDocument()
    expect(screen.getByText('Mariana Souza')).toBeVisible()
    await user.clear(screen.getByRole('textbox', { name: 'Buscar locatário ou imóvel...' }))
    await user.click(screen.getByRole('tab', { name: 'A pagar' }))
    expect(screen.getByRole('tab', { name: 'A pagar' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Energia Paulista')).toBeVisible()
    expect(screen.queryByText('Mariana Souza')).not.toBeInTheDocument()
  })
  it('validates creation, adds to the list and opens the newly created details', async () => {
    const user = userEvent.setup()
    const view = render(wrap(<ChargesPage />))
    await user.click(screen.getByRole('button', { name: 'Nova Cobrança' }))
    await user.click(screen.getByRole('button', { name: 'Criar cobrança' }))
    expect(await screen.findByText('Tenant is required')).toBeVisible()
    await user.type(screen.getByLabelText('Locatário'), 'New tenant')
    await user.type(screen.getByLabelText('Imóvel'), 'New property')
    fireEvent.change(screen.getByLabelText('Valor'), { target: { value: '1250' } })
    fireEvent.change(screen.getByLabelText('Vencimento'), { target: { value: '2025-03-22' } })
    await user.click(screen.getByRole('button', { name: 'Criar cobrança' }))
    expect(await screen.findByText('New tenant')).toBeVisible()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const created = useChargesStore.getState().charges[0]
    await user.click(
      screen.getAllByRole('button', {
        name: `Detalhes da cobrança ${created.code}`,
      })[0],
    )
    expect(push).toHaveBeenCalledWith({
      pathname: '/dashboard/finance/charges/[id]',
      params: { id: created.id },
    })
    view.rerender(detail(created.id))
    expect(screen.getByText('New tenant')).toBeVisible()
    expect(screen.getByText(created.code)).toBeVisible()
    expect(screen.getByText('Esta cobrança não possui comprovante.')).toBeVisible()
  })
  it('edits from the actions menu and shows updated details', async () => {
    const user = userEvent.setup()
    const view = render(wrap(<ChargesPage />))
    await user.click(screen.getByRole('button', { name: 'Ações #COB-2025-0340' }))
    expect(screen.queryByRole('menuitem', { name: /Visualizar/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('menuitem', { name: 'Editar' }))
    await user.clear(screen.getByLabelText('Locatário'))
    await user.type(screen.getByLabelText('Locatário'), 'Updated tenant')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    expect(await screen.findByText('Updated tenant')).toBeVisible()
    view.rerender(detail('0340'))
    expect(screen.getByText('Updated tenant')).toBeVisible()
    expect(screen.getByText('Cobrança atualizada')).toBeVisible()
  })
  it('confirms archive and keeps the record removed after remount', async () => {
    const user = userEvent.setup()
    const view = render(wrap(<ChargesPage />))
    await user.click(screen.getByRole('button', { name: 'Ações #COB-2025-0340' }))
    await user.click(screen.getByRole('menuitem', { name: 'Arquivar' }))
    expect(screen.getByText('Arquivar cobrança?')).toBeVisible()
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Arquivar' }))
    await waitFor(() => expect(screen.queryByText('Mariana Souza')).not.toBeInTheDocument())
    view.unmount()
    render(wrap(<ChargesPage />))
    expect(screen.queryByText('Mariana Souza')).not.toBeInTheDocument()
  })
  it('validates and records payment, updating details, history and the list', async () => {
    const user = userEvent.setup()
    const view = render(detail('0340'))
    await user.click(screen.getByRole('button', { name: 'Registrar pagamento' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar pagamento' }))
    expect(useChargesStore.getState().charges.find((charge) => charge.id === '0340')?.status).toBe(
      'pending',
    )
    fireEvent.change(screen.getByLabelText('Data do pagamento'), {
      target: { value: '2025-03-12' },
    })
    await user.type(screen.getByLabelText('Forma de pagamento'), 'Transferência')
    await user.click(screen.getByRole('button', { name: 'Confirmar pagamento' }))
    expect(await screen.findByText('Pagamento recebido')).toBeVisible()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByText('Pago')).toBeVisible()
    expect(screen.getAllByText(/Transferência/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/12\/03\/2025/).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: 'Voltar para Cobranças' }))
    expect(push).toHaveBeenCalledWith('/dashboard/finance/charges')
    view.rerender(wrap(<ChargesPage />))
    const row = screen.getByText('Mariana Souza').closest('tr')!
    expect(within(row).getByText('Pago')).toBeVisible()
  })
  it('renders coherent paid data and previews charge-specific documents', async () => {
    const user = userEvent.setup()
    render(detail('0333'))
    expect(screen.queryByText('Não pago')).not.toBeInTheDocument()
    expect(screen.getByText('energia.paulista@example.com')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Registrar pagamento' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Emitir 2ª via' }))
    let dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByText('#COB-2025-0333')).toBeVisible()
    expect(dialog.getByText('Energia Paulista')).toBeVisible()
    expect(dialog.getByText(/420,00/)).toBeVisible()
    await user.click(dialog.getByRole('button', { name: 'Fechar documento' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Visualizar comprovante' }))
    dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByText('REC-0333')).toBeVisible()
    expect(dialog.getByText('Boleto')).toBeVisible()
    expect(dialog.getAllByText('02/03/2025')).toHaveLength(2)
  })
  it('handles an unknown or archived ID with explicit navigation to the list', async () => {
    const user = userEvent.setup()
    render(detail('missing'))
    expect(screen.getByText(/Cobrança não encontrada/)).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Voltar para Cobranças' }))
    expect(push).toHaveBeenCalledWith('/dashboard/finance/charges')
  })
})
