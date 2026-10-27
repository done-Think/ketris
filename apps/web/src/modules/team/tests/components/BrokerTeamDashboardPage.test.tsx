import { ThemeProvider } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { AxiosError, type AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { BrokerTeamDashboardPage } from '../../components/BrokerTeamDashboardPage'
import type { TeamMember } from '../../types/team'
import { teamMember, teamOverview } from '../fixtures/team-member'

const enqueueSnackbar = vi.fn()
const createAgendaEvent = vi.fn()
const push = vi.fn()
const session = vi.hoisted(() => ({
  current: {
    accessToken: 'token',
    tenantId: 'tenant-1',
    role: 'OWNER',
    user: { id: 'owner-1', name: 'Ana Dona' },
  },
}))
const service = vi.hoisted(() => ({
  overview: vi.fn(),
  goals: vi.fn(),
  setGoal: vi.fn(),
  transfer: vi.fn(),
  deactivate: vi.fn(),
  activate: vi.fn(),
  invite: vi.fn(),
  resendInvitation: vi.fn(),
  cancelInvitation: vi.fn(),
}))

vi.mock('next-auth/react', () => ({ useSession: () => ({ data: session.current }) }))
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar }) }))
vi.mock('../../services/team-service', () => ({ teamService: service }))
vi.mock('../../components/TeamMembershipRequests', () => ({ TeamMembershipRequests: () => null }))
vi.mock('@/i18n/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('@modules/agenda/hooks/use-agenda-events', () => ({
  useCreateAgendaEvent: () => ({ mutateAsync: createAgendaEvent }),
}))
vi.mock('@modules/agenda/components/AgendaEventFormDialog', () => ({
  AgendaEventFormDialog: ({
    open,
    initialValues,
    onCreate,
  }: {
    open: boolean
    initialValues?: { title?: string; participant?: string; phone?: string }
    onCreate: (values: Record<string, unknown>) => void
  }) =>
    open ? (
      <div role="dialog" aria-label="Agenda 1:1">
        <span>{initialValues?.title}</span>
        <button
          onClick={() =>
            onCreate({
              title: initialValues?.title,
              kind: 'MEETING',
              propertyId: 'other',
              customProperty: 'Reunião interna',
              scheduledDate: '2026-10-29',
              scheduledTime: '09:00',
              durationMinutes: 60,
              participant: initialValues?.participant,
              phone: initialValues?.phone,
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

const invitation = {
  status: 'PENDING' as const,
  sentAt: '2026-10-20T12:00:00.000Z',
  expiresAt: '2026-10-27T12:00:00.000Z',
}
const marina = teamMember()
const bruno = teamMember({
  id: 'agent-2',
  name: 'Bruno Lima',
  email: 'bruno@ketris.dev',
  phone: null,
  headline: null,
  specialties: [],
  hasPublicProfile: false,
  goal: null,
  pace: { status: 'NO_GOAL', expectedSales: null, goalProgress: null },
  metrics: { properties: 4, openLeads: 1, monthlySales: 1, returns: 0, responseTimeMinutes: null },
})
const carla = teamMember({ id: 'agent-3', name: 'Carla Inativa', active: false })
const diego = teamMember({ id: 'agent-4', name: 'Diego Convidado', invitation })

function apiError(code: string) {
  return new AxiosError('error', '409', undefined, undefined, {
    status: 409,
    data: { error: { code } },
  } as AxiosResponse)
}

function renderPage(members: TeamMember[] = [marina, bruno, carla, diego]) {
  service.overview.mockResolvedValue(teamOverview(members))
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider theme={theme}>
        <BrokerTeamDashboardPage />
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

async function card(name: string) {
  const title = await screen.findByText(name, { selector: '.broker-card-name' })

  return title.closest('.MuiPaper-root') as HTMLElement
}

async function openAction(name: string, action: string) {
  fireEvent.click(within(await card(name)).getByRole('button', { name: 'Mais opções' }))
  fireEvent.click(screen.getByRole('menuitem', { name: action }))
}

beforeEach(() => {
  vi.clearAllMocks()
  service.goals.mockResolvedValue([])
})

describe('BrokerTeamDashboardPage', () => {
  it('shows the real KPIs, metrics, pace and contact links of each broker', async () => {
    renderPage()
    const marinaCard = await card('Marina Costa')

    expect(screen.getByText('Corretores ativos').nextSibling).toHaveTextContent('2')
    expect(screen.getByText('1 convite pendente')).toBeVisible()
    expect(screen.getByText('Meta média').nextSibling).toHaveTextContent('50%')
    expect(within(marinaCard).getByText('Especialista em alto padrão')).toBeVisible()
    expect(within(marinaCard).getByText('No ritmo')).toBeVisible()
    expect(within(marinaCard).getByText('3 retornos')).toBeVisible()
    expect(within(marinaCard).getByText('Resposta: 1 h 35 min')).toBeVisible()
    expect(
      within(marinaCard).getByRole('link', { name: 'Enviar mensagem no WhatsApp' }),
    ).toHaveAttribute('href', 'https://wa.me/5511988887777')
    expect(within(marinaCard).getByRole('link', { name: 'Ligar' })).toHaveAttribute(
      'href',
      'tel:+5511988887777',
    )

    const brunoCard = await card('Bruno Lima')
    expect(within(brunoCard).getByText('Sem meta')).toBeVisible()
    expect(within(brunoCard).getByText('Resposta: —')).toBeVisible()
    expect(within(brunoCard).getByRole('button', { name: 'Ligar' })).toBeDisabled()
    expect(
      within(brunoCard).getByRole('button', { name: 'Ver perfil de Bruno Lima' }),
    ).toBeDisabled()
    expect(within(await card('Carla Inativa')).getByText('Inativo')).toBeVisible()
    expect(within(await card('Diego Convidado')).getByText('Convite pendente')).toBeVisible()
  })

  it('opens the public profile by the user id and filters the list by search', async () => {
    renderPage()
    fireEvent.click(
      within(await card('Marina Costa')).getByRole('button', {
        name: 'Ver perfil de Marina Costa',
      }),
    )
    expect(push).toHaveBeenCalledWith({ pathname: '/brokers/[id]', params: { id: 'agent-1' } })

    fireEvent.change(screen.getByRole('textbox', { name: /buscar/i }), {
      target: { value: 'bruno' },
    })
    expect(screen.queryByText('Marina Costa')).not.toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox', { name: /buscar/i }), {
      target: { value: 'ninguém' },
    })
    expect(screen.getByText('Nenhum corretor encontrado.')).toBeVisible()
  })

  it('shows the empty team state', async () => {
    renderPage([])
    expect(
      await screen.findByText('Sua equipe ainda não tem corretores. Convide o primeiro.'),
    ).toBeVisible()
  })

  it('retries after a load error', async () => {
    service.overview.mockReset()
    service.overview.mockRejectedValueOnce(new Error('boom'))
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <ThemeProvider theme={theme}>
          <BrokerTeamDashboardPage />
        </ThemeProvider>
      </QueryClientProvider>,
    )
    const retry = await screen.findByRole('button', { name: 'Tentar novamente' })
    service.overview.mockResolvedValue(teamOverview([marina]))
    fireEvent.click(retry)
    expect(await card('Marina Costa')).toBeVisible()
  })

  it('offers menu actions according to the member state', async () => {
    renderPage()
    fireEvent.click(
      within(await card('Carla Inativa')).getByRole('button', { name: 'Mais opções' }),
    )
    expect(screen.getByRole('menuitem', { name: 'Reativar corretor' })).toBeVisible()
    expect(screen.queryByRole('menuitem', { name: 'Desativar corretor' })).not.toBeInTheDocument()
  })

  it('shows the performance of the broker', async () => {
    renderPage()
    await openAction('Marina Costa', 'Ver desempenho')
    const dialog = screen.getByRole('dialog')

    expect(within(dialog).getByText('Desempenho — Marina Costa')).toBeVisible()
    expect(
      within(dialog).getByText('Meta mensal de vendas: 4 · Esperado até hoje: 2.3'),
    ).toBeVisible()
  })

  it('saves the monthly goal and shows its history', async () => {
    service.goals.mockResolvedValue([
      { id: 'g1', monthlySales: 4, setAt: '2026-10-01T12:00:00.000Z', setByName: 'Dona Ana' },
    ])
    service.setGoal.mockResolvedValue({})
    renderPage()
    await openAction('Marina Costa', 'Definir meta mensal')
    const dialog = screen.getByRole('dialog')
    const input = within(dialog).getByRole('spinbutton', { name: 'Meta mensal de vendas' })

    expect(input).toHaveValue(4)
    expect(await within(dialog).findByText(/4 vendas · Dona Ana em/)).toBeVisible()
    fireEvent.change(input, { target: { value: '0' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }))
    expect(
      await within(dialog).findByText('Informe uma meta inteira entre 1 e 10000'),
    ).toBeVisible()
    fireEvent.change(input, { target: { value: '6' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(service.setGoal).toHaveBeenCalledWith('agent-1', 6))
    expect(enqueueSnackbar).toHaveBeenCalledWith('Meta mensal atualizada', { variant: 'success' })
  })

  it('transfers the chosen items to another broker or to the owner', async () => {
    service.transfer.mockResolvedValue({ properties: 7, leads: 0, futureEvents: 2 })
    renderPage()
    await openAction('Marina Costa', 'Transferir carteira')
    const dialog = screen.getByRole('dialog')

    fireEvent.mouseDown(within(dialog).getByRole('combobox', { name: 'Transferir para' }))
    const options = screen.getAllByRole('option').map((option) => option.textContent)
    expect(options).toEqual(['Ana Dona (você)', 'Bruno Lima'])
    fireEvent.click(screen.getByRole('option', { name: 'Bruno Lima' }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Transferir' }))
    expect(await within(dialog).findByText('Selecione ao menos um item')).toBeVisible()

    fireEvent.click(within(dialog).getByLabelText('Imóveis, com as oportunidades deles (7)'))
    fireEvent.click(within(dialog).getByLabelText('Eventos futuros da agenda'))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Transferir' }))

    await waitFor(() =>
      expect(service.transfer).toHaveBeenCalledWith('agent-1', {
        destinationId: 'agent-2',
        properties: true,
        leads: false,
        futureEvents: true,
      }),
    )
    expect(enqueueSnackbar).toHaveBeenCalledWith('Transferidos: 7 imóveis, 0 leads e 2 eventos', {
      variant: 'success',
    })
  })

  it('requires a destination before deactivating a broker', async () => {
    service.deactivate.mockResolvedValue({ properties: 7, leads: 4, futureEvents: 0 })
    renderPage()
    await openAction('Marina Costa', 'Desativar corretor')
    const dialog = screen.getByRole('dialog')

    fireEvent.click(within(dialog).getByRole('button', { name: 'Transferir e desativar' }))
    expect(
      await within(dialog).findByText('Selecione o corretor que vai receber a carteira'),
    ).toBeVisible()
    fireEvent.mouseDown(within(dialog).getByRole('combobox', { name: /Transferir para/ }))
    fireEvent.click(screen.getByRole('option', { name: 'Ana Dona (você)' }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Transferir e desativar' }))

    await waitFor(() => expect(service.deactivate).toHaveBeenCalledWith('agent-1', 'owner-1'))
    expect(enqueueSnackbar).toHaveBeenCalledWith(
      'Marina Costa foi desativado e a carteira foi transferida',
      { variant: 'success' },
    )
  })

  it('reactivates an inactive broker from the menu', async () => {
    service.activate.mockResolvedValue(undefined)
    renderPage()
    await openAction('Carla Inativa', 'Reativar corretor')

    await waitFor(() => expect(service.activate).toHaveBeenCalledWith('agent-3'))
    expect(enqueueSnackbar).toHaveBeenCalledWith('Carla Inativa foi reativado', {
      variant: 'success',
    })
  })

  it('invites a broker by e-mail and warns when the e-mail was not delivered', async () => {
    service.invite.mockResolvedValue({ brokerId: 'agent-9', emailDelivered: false })
    renderPage()
    await card('Marina Costa')
    fireEvent.click(screen.getByRole('button', { name: 'Convidar corretor' }))
    const dialog = screen.getByRole('dialog')

    fireEvent.change(within(dialog).getByLabelText('Nome completo'), { target: { value: 'Eva' } })
    fireEvent.change(within(dialog).getByLabelText('E-mail'), {
      target: { value: 'eva@ketris.dev' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Enviar convite' }))

    await waitFor(() =>
      expect(service.invite).toHaveBeenCalledWith({
        name: 'Eva',
        email: 'eva@ketris.dev',
        locale: 'pt-BR',
      }),
    )
    expect(enqueueSnackbar).toHaveBeenCalledWith(
      'Convite criado, mas o e-mail não foi enviado. Use Reenviar convite.',
      { variant: 'warning' },
    )
  })

  it('maps the e-mail in use error when inviting', async () => {
    service.invite.mockRejectedValue(apiError('EMAIL_ALREADY_IN_USE'))
    renderPage()
    await card('Marina Costa')
    fireEvent.click(screen.getByRole('button', { name: 'Convidar corretor' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Nome completo'), { target: { value: 'Eva' } })
    fireEvent.change(within(dialog).getByLabelText('E-mail'), {
      target: { value: 'eva@ketris.dev' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Enviar convite' }))

    await waitFor(() =>
      expect(enqueueSnackbar).toHaveBeenCalledWith('Este e-mail já está em uso nesta imobiliária', {
        variant: 'error',
      }),
    )
  })

  it('resends and cancels pending invitations', async () => {
    service.resendInvitation.mockResolvedValue({ emailDelivered: true })
    service.cancelInvitation.mockRejectedValueOnce(apiError('TEAM_INVITATION_HAS_PORTFOLIO'))
    renderPage()
    await openAction('Diego Convidado', 'Reenviar convite')
    await waitFor(() => expect(service.resendInvitation).toHaveBeenCalledWith('agent-4', 'pt-BR'))
    expect(enqueueSnackbar).toHaveBeenCalledWith('Convite reenviado para marina@ketris.dev', {
      variant: 'success',
    })

    await openAction('Diego Convidado', 'Cancelar convite')
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar convite' }))
    await waitFor(() =>
      expect(enqueueSnackbar).toHaveBeenCalledWith(
        'Este convidado já tem imóveis, leads ou eventos. Transfira antes de cancelar.',
        { variant: 'error' },
      ),
    )
  })

  it('schedules a 1:1 with the broker in the agenda', async () => {
    createAgendaEvent.mockResolvedValue({ id: 'event-1' })
    renderPage()
    await openAction('Marina Costa', 'Agendar 1:1')
    const dialog = screen.getByRole('dialog', { name: 'Agenda 1:1' })

    expect(within(dialog).getByText('1:1 — Marina Costa')).toBeVisible()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Criar evento' }))

    await waitFor(() =>
      expect(createAgendaEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '1:1 — Marina Costa',
          kind: 'MEETING',
          propertyReference: 'Reunião interna',
          participantName: 'Marina Costa',
          participantPhone: '(11) 98888-7777',
        }),
      ),
    )
    expect(enqueueSnackbar).toHaveBeenCalledWith('1:1 agendado com sucesso', { variant: 'success' })
  })

  it('does not load the team nor offer invitations to non-owners', async () => {
    session.current = { ...session.current, role: 'AGENT' }
    renderPage()
    expect(screen.queryByRole('button', { name: 'Convidar corretor' })).not.toBeInTheDocument()
    expect(service.overview).not.toHaveBeenCalled()
    session.current = { ...session.current, role: 'OWNER' }
  })
})
