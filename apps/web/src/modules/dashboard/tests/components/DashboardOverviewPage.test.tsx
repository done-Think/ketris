import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { UserRole } from '@shared/types/user-role'

import { DashboardOverviewPage } from '../../components/DashboardOverviewPage'
import { dashboardService } from '../../services/dashboard-service'
import { apiAgencyOverview, apiDashboardOverview } from '../fixtures/dashboard'
import { renderWithProviders } from '../fixtures/render'

const { session } = vi.hoisted(() => ({
  session: { tenantId: 'tenant-1', role: 'OWNER' as UserRole, user: { id: 'user-1' } },
}))

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: session, status: 'authenticated' }),
}))
vi.mock('@shared/components/layout', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@shared/components/layout')>()),
  DashboardNotificationsButton: () => null,
}))
vi.mock('../../services/dashboard-service', () => ({
  dashboardService: { getOverview: vi.fn(), getAgencyOverview: vi.fn() },
}))

function renderPage(role: UserRole) {
  session.role = role
  return renderWithProviders(<DashboardOverviewPage />)
}

function metricValue(label: string) {
  return within(screen.getByText(label).parentElement!)
}

describe('DashboardOverviewPage', () => {
  beforeEach(() => {
    vi.mocked(dashboardService.getOverview).mockReset().mockResolvedValue(apiDashboardOverview)
    vi.mocked(dashboardService.getAgencyOverview).mockReset().mockResolvedValue(apiAgencyOverview)
  })

  it('mostra os números do endpoint agregado para o corretor, sem os da imobiliária', async () => {
    renderPage('AGENT')

    expect(await screen.findByText('Visita ao apartamento Batel')).toBeInTheDocument()
    expect(metricValue('Leads ativos').getByText('6')).toBeInTheDocument()
    expect(metricValue('Visitas mês').getByText('4')).toBeInTheDocument()
    expect(metricValue('Propostas').getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Carlos Lima')).toBeInTheDocument()
    expect(dashboardService.getAgencyOverview).not.toHaveBeenCalled()
    expect(screen.queryByText('Imóveis na carteira')).not.toBeInTheDocument()
  })

  it('mostra também os números da imobiliária para o OWNER', async () => {
    renderPage('OWNER')

    expect(await screen.findByText('42')).toBeInTheDocument()
    expect(screen.getByText('Imóveis na carteira')).toBeInTheDocument()
    expect(screen.getByText('Top Corretores')).toBeInTheDocument()
    expect(screen.getByText('Bruna recebeu o lead Carlos')).toBeInTheDocument()
    expect(dashboardService.getAgencyOverview).toHaveBeenCalledTimes(1)
  })

  it('mostra os cards zerados enquanto o endpoint carrega', () => {
    vi.mocked(dashboardService.getOverview).mockReturnValue(new Promise(() => undefined))
    renderPage('AGENT')

    expect(metricValue('Leads ativos').getByText('0')).toBeInTheDocument()
    expect(screen.getByText('Nenhuma atividade agendada.')).toBeInTheDocument()
  })

  it('abre o detalhe da atividade com o imóvel que veio do próprio endpoint', async () => {
    renderPage('AGENT')

    await userEvent.click(await screen.findByText('Visita ao apartamento Batel'))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Imóvel da visita')).toBeInTheDocument()
    expect(within(dialog).getByText('Rua Bispo, 10 - Batel, Curitiba')).toBeInTheDocument()
  })

  it('abre e fecha o detalhe do lead', async () => {
    renderPage('AGENT')

    await userEvent.click(await screen.findByRole('button', { name: 'Detalhes' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Detalhes do lead')).toBeInTheDocument()

    await userEvent.click(within(dialog).getByRole('button', { name: 'Fechar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
