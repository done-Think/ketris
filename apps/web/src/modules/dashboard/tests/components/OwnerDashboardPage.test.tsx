import { ThemeProvider } from '@mui/material'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { OwnerDashboardPage } from '../../components/OwnerDashboardPage'

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { name: 'Carlos Oliveira' } } }),
}))

function renderOwnerDashboard() {
  return render(
    <ThemeProvider theme={theme}>
      <OwnerDashboardPage />
    </ThemeProvider>,
  )
}

describe('OwnerDashboardPage', () => {
  it('renders the complete owner dashboard reference content', () => {
    renderOwnerDashboard()

    expect(screen.getByRole('heading', { name: 'Painel do Proprietário' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Anunciar Novo Imóvel' })).toHaveAttribute(
      'href',
      '/dashboard/imoveis/novo',
    )

    const indicators = screen.getByLabelText('Indicadores do painel do proprietário')
    ;[
      ['Imóveis Ativos', '3', 'De 4 cadastrados'],
      ['Propostas Pendentes', '7', 'Aguardando resposta'],
      ['Visitas esta Semana', '4', 'Próxima hoje às 14h'],
      ['Receita Potencial', 'R$ 18.600', 'Aluguel total previsto'],
    ].forEach(([label, value, caption]) => {
      const card = within(indicators).getByText(label).closest('article')
      expect(card).not.toBeNull()
      expect(within(card!).getByText(value, { selector: 'p' })).toBeVisible()
      expect(within(card!).getByText(caption)).toBeVisible()
    })
    expect(within(indicators).getByText('+12%')).toBeVisible()

    const proposals = screen.getByRole('table', { name: 'Propostas recentes do proprietário' })
    expect(within(proposals).getAllByRole('row')).toHaveLength(5)
    expect(within(proposals).getByText('Mariana Costa')).toBeVisible()
    expect(within(proposals).getByText('R$ 4.500/mês')).toBeVisible()
    expect(within(proposals).getByText('Duplex Alto Lapa')).toBeVisible()
    expect(within(proposals).getAllByRole('button', { name: /Aceitar proposta/ })).toHaveLength(4)

    expect(screen.getByRole('heading', { name: 'Próximas Visitas' })).toBeVisible()
    expect(screen.getByText('Apartamento Jardins')).toBeVisible()
    expect(screen.getAllByText('Studio Loft Pinheiros').length).toBeGreaterThan(0)
    expect(screen.getByText('Casa Campo Belo')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Desempenho Semanal' })).toBeVisible()
    expect(screen.getByText('+15% views')).toBeVisible()
    expect(screen.getByRole('img', { name: 'Tendência semanal de visualizações' })).toBeVisible()
  })

  it('renders the compact mobile reference using the existing dashboard fixtures', () => {
    renderOwnerDashboard()
    expect(screen.getByRole('heading', { name: 'Meu Painel' })).toBeVisible()
    expect(screen.getByText('Olá, Carlos')).toBeVisible()
    expect(screen.getByText('4 imóveis anunciados')).toBeVisible()
    expect(screen.getByText('3 ativos')).toBeVisible()
    expect(screen.getByText('1 pausado')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Ver propostas recebidas' })).toHaveAttribute(
      'href',
      '/dashboard/propostas',
    )
    const proposals = within(screen.getByLabelText('Lista móvel de propostas recentes'))
    expect(proposals.getAllByRole('button', { name: /Aceitar proposta/ })).toHaveLength(3)
    expect(proposals.getByText('Apartamento Jardins - 3q')).toBeVisible()
    expect(proposals.getByText('Casa Duplex Alto da Lapa')).toBeVisible()
    expect(proposals.getByText('2h atrás')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'VISITAS AGENDADAS' })).toBeVisible()
  })

  it('exposes the reference quick actions with valid destinations', () => {
    renderOwnerDashboard()

    const quickActions = screen.getByLabelText('Atalhos rápidos do proprietário')
    ;[
      ['Anunciar Imóvel', '/dashboard/imoveis/novo'],
      ['Gerar Relatório', '/dashboard/financeiro'],
      ['Configurar Alertas', '/dashboard/agenda'],
      ['Suporte Ketris', 'mailto:suporte@ketris.com.br'],
    ].forEach(([name, href]) => {
      expect(within(quickActions).getByRole('link', { name })).toHaveAttribute('href', href)
    })
  })
})
