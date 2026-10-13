import { ThemeProvider } from '@mui/material'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { BrokerTeamDashboardPage } from '../../components/BrokerTeamDashboardPage'

const enqueueSnackbar = vi.fn()
const mutateAsync = vi.fn().mockResolvedValue({ id: 'event-1' })

vi.mock('next-auth/react', () => ({ useSession: () => ({ data: { tenantId: 'tenant-1' } }) }))
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar }) }))
vi.mock('@modules/agenda/hooks/use-agenda-events', () => ({
  useCreateAgendaEvent: () => ({ mutateAsync }),
}))
vi.mock('@modules/agenda/components/AgendaEventFormDialog', () => ({
  AgendaEventFormDialog: ({
    open,
    initialValues,
    onCreate,
  }: {
    open: boolean
    initialValues?: { title?: string; participant?: string }
    onCreate: (values: Record<string, unknown>) => void
  }) =>
    open ? (
      <div role="dialog" aria-label="Agenda 1:1">
        <span>{initialValues?.title}</span>
        <span>{initialValues?.participant}</span>
        <button
          onClick={() =>
            onCreate({
              title: initialValues?.title,
              kind: 'MEETING',
              propertyId: 'other',
              customProperty: 'Reunião interna',
              scheduledDate: '2026-10-05',
              scheduledTime: '09:00',
              durationMinutes: 60,
              participant: initialValues?.participant,
              phone: '(11) 99999-9999',
              notes: '',
            })
          }
        >
          Criar evento
        </button>
      </div>
    ) : null,
}))
vi.mock('@shared/components/layout', () => ({
  DashboardPageHeader: ({ title, actions }: { title: string; actions: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {actions}
    </div>
  ),
  DashboardHeaderActionButton: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
  DashboardNotificationsButton: () => null,
}))

function renderPage() {
  render(
    <ThemeProvider theme={theme}>
      <BrokerTeamDashboardPage />
    </ThemeProvider>,
  )
}

function openAction(brokerName: string, actionName: string) {
  const profile = screen.getByRole('button', { name: `Ver perfil de ${brokerName}` })
  const card = profile.closest('.MuiPaper-root') as HTMLElement
  fireEvent.click(within(card).getByRole('button', { name: 'Mais opções' }))
  fireEvent.click(screen.getByRole('menuitem', { name: actionName }))
  return card
}

describe('broker team menu actions', () => {
  it('opens performance for the selected broker using existing metrics', () => {
    renderPage()
    openAction('Marina Souza', 'Ver desempenho')
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Desempenho — Marina Souza')).toBeVisible()
    expect(within(dialog).getByText('95%')).toBeVisible()
    expect(enqueueSnackbar).not.toHaveBeenCalled()
  })

  it('validates and saves an individual monthly goal', async () => {
    renderPage()
    openAction('Thiago Lopes', 'Editar meta mensal')
    const dialog = screen.getByRole('dialog')
    const input = within(dialog).getByRole('spinbutton', { name: 'Meta mensal' })
    expect(input).toHaveValue(13)
    fireEvent.change(input, { target: { value: '20' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    openAction('Thiago Lopes', 'Ver desempenho')
    expect(within(screen.getByRole('dialog')).getByText('Meta mensal: 20')).toBeVisible()
  })

  it('transfers selected counts between brokers and prevents self-destination', async () => {
    renderPage()
    openAction('Marina Souza', 'Transferir leads/imóveis')
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).queryByRole('option', { name: 'Marina Souza' })).not.toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Transferir' }))
    expect(dialog).toBeVisible()
    fireEvent.mouseDown(within(dialog).getByRole('combobox', { name: 'Transferir para' }))
    fireEvent.click(screen.getByRole('option', { name: 'Thiago Lopes' }))
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Leads (18)' }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Transferir' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    openAction('Thiago Lopes', 'Ver desempenho')
    expect(within(screen.getByRole('dialog')).getByText('33')).toBeVisible()
  })

  it('opens the existing agenda creation flow and saves through its mutation', async () => {
    renderPage()
    openAction('Marina Souza', 'Agendar 1:1')
    expect(screen.getByRole('dialog', { name: 'Agenda 1:1' })).toHaveTextContent('Marina Souza')
    expect(mutateAsync).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Criar evento' }))
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ participantName: 'Marina Souza' }),
      ),
    )
  })

  it('does not deactivate on cancel, but changes status and menu on confirm', async () => {
    renderPage()
    openAction('Marina Souza', 'Pausar/desativar corretor')
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByText('Inativo')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    openAction('Marina Souza', 'Pausar/desativar corretor')
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar' }))
    await waitFor(() => expect(screen.getByText('Inativo')).toBeVisible())
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const profile = screen.getByRole('button', { name: 'Ver perfil de Marina Souza' })
    fireEvent.click(
      within(profile.closest('.MuiPaper-root') as HTMLElement).getByRole('button', {
        name: 'Mais opções',
      }),
    )
    expect(screen.getByRole('menuitem', { name: 'Ativar corretor' })).toBeVisible()
  })
})
