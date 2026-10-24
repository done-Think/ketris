import { ThemeProvider } from '@mui/material'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { BrokerTeamDashboardPage } from '../../components/BrokerTeamDashboardPage'

const strongPasswordPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12}$/
const enqueueSnackbar = vi.fn()
const mutateAsync = vi.fn().mockResolvedValue({ id: 'event-1' })
const createUserMutateAsync = vi.fn()
const session = vi.hoisted(() => ({ tenantId: 'tenant-1', role: 'OWNER' }))

vi.mock('next-auth/react', () => ({ useSession: () => ({ data: session }) }))
vi.mock('@modules/auth/hooks/use-create-user', () => ({
  useCreateUser: () => ({ mutateAsync: createUserMutateAsync, isPending: false }),
}))
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar }) }))
vi.mock('../../components/TeamMembershipRequests', () => ({
  TeamMembershipRequests: () => null,
}))
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
  DashboardHeaderActionButton: ({
    children,
    onClick,
  }: {
    children: React.ReactNode
    onClick?: () => void
  }) => <button onClick={onClick}>{children}</button>,
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

describe('invite broker', () => {
  function fillInviteForm() {
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Nome completo'), {
      target: { value: ' Bruno Lima ' },
    })
    fireEvent.change(within(dialog).getByLabelText('E-mail'), {
      target: { value: 'bruno@ketris.dev' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Convidar' }))
  }

  it('validates the form and creates the broker as an AGENT user', async () => {
    createUserMutateAsync.mockResolvedValueOnce({ id: 'user-1' })
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Convidar corretor' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Convidar' }))

    expect(await screen.findByText('Informe o nome do corretor')).toBeInTheDocument()
    expect(screen.getByText('Informe um e-mail válido')).toBeInTheDocument()
    expect(createUserMutateAsync).not.toHaveBeenCalled()

    fillInviteForm()

    await waitFor(() =>
      expect(createUserMutateAsync).toHaveBeenCalledWith({
        name: 'Bruno Lima',
        email: 'bruno@ketris.dev',
        password: expect.stringMatching(strongPasswordPattern),
        role: 'AGENT',
      }),
    )
    expect(enqueueSnackbar).toHaveBeenCalledWith('Bruno Lima foi adicionado à equipe', {
      variant: 'success',
    })
  })

  it('generates a temporary password that can be regenerated and copied', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Convidar corretor' }))
    const dialog = screen.getByRole('dialog')
    const passwordInput = within(dialog).getByLabelText('Senha provisória') as HTMLInputElement
    const firstPassword = passwordInput.value

    expect(firstPassword).toMatch(strongPasswordPattern)
    expect(passwordInput).toHaveAttribute('readonly')

    fireEvent.click(within(dialog).getByRole('button', { name: 'Gerar nova senha' }))
    await waitFor(() => expect(passwordInput.value).not.toBe(firstPassword))

    fireEvent.click(within(dialog).getByRole('button', { name: 'Copiar senha' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(passwordInput.value))
  })

  it('shows a specific message when the e-mail is already in use', async () => {
    createUserMutateAsync.mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { error: { code: 'EMAIL_ALREADY_IN_USE' } } },
    })
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Convidar corretor' }))
    fillInviteForm()

    await waitFor(() =>
      expect(enqueueSnackbar).toHaveBeenCalledWith('Este e-mail já está em uso', {
        variant: 'error',
      }),
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it.each(['AGENT', 'RENTER', 'PROPERTY_OWNER'])('hides the invite action from %s', (role) => {
    session.role = role
    try {
      renderPage()
      expect(screen.queryByRole('button', { name: 'Convidar corretor' })).not.toBeInTheDocument()
    } finally {
      session.role = 'OWNER'
    }
  })
})
