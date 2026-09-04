import { ThemeProvider } from '@mui/material'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { theme } from '@shared/theme/theme'

import { OwnerDashboardPage } from '../../components/OwnerDashboardPage'

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
    expect(screen.getByText('Studio Loft Pinheiros')).toBeVisible()
    expect(screen.getByText('Casa Campo Belo')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Desempenho Semanal' })).toBeVisible()
    expect(screen.getByText('+15% views')).toBeVisible()
    expect(screen.getByRole('img', { name: 'Tendência semanal de visualizações' })).toBeVisible()
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
