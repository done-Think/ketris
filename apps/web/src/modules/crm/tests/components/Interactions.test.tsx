import { ThemeProvider } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { theme } from '@shared/theme/theme'
import { TrackedLeadContactDialog } from '../../components/interactions/TrackedLeadContactDialog'
import { InteractionHistory } from '../../components/interactions/InteractionHistory'
import { interactionService } from '../../services/interaction-service'
import type { DashboardLead } from '../../types/lead'
import type { CrmInteraction } from '../../types/interaction'

vi.mock('@shared/hooks/use-tenant-session-scope', () => ({
  useTenantSessionScope: () => ({
    tenantId: 'tenant',
    userId: 'agent',
    role: 'AGENT',
    actorKey: ['tenant', 'agent'],
    enabled: true,
  }),
}))
vi.mock('../../services/interaction-service', () => ({
  interactionService: { list: vi.fn(), start: vi.fn(), complete: vi.fn() },
}))
const interaction: CrmInteraction = {
  id: 'interaction',
  leadId: 'lead',
  leadName: 'Customer',
  opportunityId: null,
  channel: 'WHATSAPP',
  status: 'STARTED',
  description: null,
  actorUserId: 'agent',
  actorName: 'Broker',
  completedById: null,
  createdAt: '2026-11-19T12:00:00Z',
  completedAt: null,
  canComplete: true,
}
const lead: DashboardLead = {
  id: 'lead',
  name: 'Customer',
  phone: '11999990000',
  email: 'customer@example.invalid',
  budget: '',
  interest: 'House',
  source: 'OTHER',
  broker: 'Broker',
  stage: 'NEW',
  opportunityId: null,
  lastContact: '',
  lastContactAt: '',
}
function show(component: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider theme={theme}>{component}</ThemeProvider>
    </QueryClientProvider>,
  )
}
function dialog() {
  return (
    <TrackedLeadContactDialog
      lead={lead}
      open
      onClose={vi.fn()}
      onStageChange={vi.fn()}
      onConvertRequest={vi.fn()}
    />
  )
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(interactionService.list).mockResolvedValue({
    interactions: [],
    pagination: { page: 1, pageSize: 5, pageCount: 1, totalCount: 0 },
  })
  vi.mocked(interactionService.start).mockResolvedValue(interaction)
  vi.mocked(interactionService.complete).mockResolvedValue({
    ...interaction,
    status: 'CONTACT_MADE',
    canComplete: false,
  })
})
describe('Contact attempt UI', () => {
  it.each([
    ['Ligar', 'PHONE'],
    ['E-mail', 'EMAIL'],
    ['WhatsApp', 'WHATSAPP'],
  ] as const)('records %s without confirming successful contact', async (label, channel) => {
    show(dialog())
    const link = screen.getByRole('link', { name: label })
    link.addEventListener('click', (event) => event.preventDefault())
    fireEvent.click(link)
    await waitFor(() =>
      expect(interactionService.start).toHaveBeenCalledWith('lead', {
        channel,
        requestId: expect.any(String),
      }),
    )
    expect(interactionService.complete).not.toHaveBeenCalled()
    expect(
      await screen.findByText(
        'Atalho acionado. Registre abaixo o resultado quando concluir o atendimento.',
      ),
    ).toBeVisible()
  })
  it('retries a failed record using the same identifier without reactivating the contact shortcut', async () => {
    vi.mocked(interactionService.start).mockRejectedValueOnce(new Error('Offline'))
    show(dialog())
    const link = screen.getByRole('link', { name: 'WhatsApp' })
    link.addEventListener('click', (event) => event.preventDefault())
    fireEvent.click(link)
    const retry = await screen.findByRole('button', { name: 'Salvar tentativa novamente' })
    fireEvent.click(retry)
    await waitFor(() => expect(interactionService.start).toHaveBeenCalledTimes(2))
    const calls = vi.mocked(interactionService.start).mock.calls
    expect(calls[1]).toEqual(calls[0])
  })
  it('requires an explicit outcome before saving a contact confirmation', async () => {
    const user = userEvent.setup()
    vi.mocked(interactionService.list).mockResolvedValue({
      interactions: [interaction],
      pagination: { page: 1, pageSize: 5, pageCount: 1, totalCount: 1 },
    })
    show(<InteractionHistory target={{ kind: 'lead', id: 'lead' }} />)
    await user.click(await screen.findByRole('button', { name: 'Registrar resultado' }))
    await user.click(screen.getByRole('button', { name: 'Salvar resultado' }))
    expect(await screen.findByText('Selecione um resultado.')).toBeVisible()
    expect(interactionService.complete).not.toHaveBeenCalled()
    await user.click(screen.getByRole('combobox', { name: 'Resultado do contato' }))
    await user.click(screen.getByRole('option', { name: 'Consegui contato' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Observa\u00e7\u00e3o (opcional)' }),
      'Customer confirmed interest',
    )
    await user.click(screen.getByRole('button', { name: 'Salvar resultado' }))
    await waitFor(() =>
      expect(interactionService.complete).toHaveBeenCalledWith('interaction', {
        status: 'CONTACT_MADE',
        description: 'Customer confirmed interest',
      }),
    )
  })
})
