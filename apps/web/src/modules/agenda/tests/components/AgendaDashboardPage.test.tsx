import { ThemeProvider } from '@mui/material'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { AgendaDashboardPage } from '../../components/AgendaDashboardPage'

const mocks = vi.hoisted(() => ({
  enqueueSnackbar: vi.fn(),
}))

vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: mocks.enqueueSnackbar }),
}))

function renderPage() {
  return render(
    <ThemeProvider theme={theme}>
      <AgendaDashboardPage />
    </ThemeProvider>,
  )
}

describe('AgendaDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the header and today events on the calendar', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Agenda' })).toBeVisible()
    expect(screen.getByText('09:00 - Visita Jardim Paulista')).toBeVisible()
  })

  it('shows agenda alerts for today visits and assigned events', async () => {
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: 'Abrir notificações do dashboard' }))

    const popover = await screen.findByText('Alertas do dashboard')
    const panel = popover.closest('[role="presentation"]') ?? document.body

    expect(within(panel as HTMLElement).getByText('Visita marcada para hoje')).toBeVisible()
    expect(
      within(panel as HTMLElement).getAllByText('Novo compromisso atribuído').length,
    ).toBeGreaterThan(0)
  })

  it('creates a new event through the form dialog', async () => {
    renderPage()

    const [newEventButton] = screen.getAllByRole('button', { name: 'Novo Evento' })
    await userEvent.click(newEventButton)
    await userEvent.type(screen.getByLabelText('Título'), 'Visita apartamento novo')
    await userEvent.click(screen.getByLabelText('Imóvel em questão'))
    await userEvent.click(await screen.findByRole('option', { name: 'Outro' }))
    await userEvent.type(screen.getByLabelText('Imóvel ou referência'), 'Sala comercial centro')
    await userEvent.type(screen.getByLabelText('Pessoa'), 'Novo Cliente')
    await userEvent.type(screen.getByLabelText('Telefone'), '11987654321')

    await userEvent.click(screen.getByRole('button', { name: 'Criar evento' }))

    await waitFor(() =>
      expect(mocks.enqueueSnackbar).toHaveBeenCalledWith(
        'Visita apartamento novo adicionado à agenda.',
        { variant: 'success' },
      ),
    )
    expect(screen.getByText('09:00 - Visita apartamento novo')).toBeVisible()
  })

  it('switches the mobile day list when a different day chip is selected', async () => {
    const user = userEvent.setup()
    const { container } = renderPage()

    expect(screen.getByText(/Visita Jardim Paulista - /)).toBeVisible()

    const dayButtons = container.querySelectorAll('button[aria-pressed]')
    await user.click(dayButtons[2])

    expect(screen.getByText(/Reunião captação - /)).toBeVisible()
    expect(screen.queryByText(/Visita Jardim Paulista - /)).not.toBeInTheDocument()
  })
})
