import { ThemeProvider } from '@mui/material'
import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { PlatformSystemPage } from '../../components/PlatformSystemPage'
import type { ApiSystemHealth } from '../../types/platform-system'

const { useSystemHealth } = vi.hoisted(() => ({ useSystemHealth: vi.fn() }))
vi.mock('../../hooks/use-platform-overview', () => ({ useSystemHealth }))

const healthy: ApiSystemHealth = {
  checkedAt: '2026-10-15T12:00:05.000Z',
  database: { status: 'up', latencyMs: 12 },
  serverUptimeSeconds: 2 * 3600 + 15 * 60 + 30,
  errorTracking: { configured: false },
}

function mockHealth(data: Partial<ApiSystemHealth>) {
  vi.mocked(useSystemHealth).mockReturnValue({
    data: { ...healthy, ...data },
    isPending: false,
    isError: false,
  })
}

function renderPage() {
  return render(
    <ThemeProvider theme={theme}>
      <PlatformSystemPage />
    </ThemeProvider>,
  )
}

describe('PlatformSystemPage', () => {
  beforeEach(() => mockHealth({}))

  it('shows the measured database latency and the server uptime', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Saúde do Sistema' })).toBeVisible()
    const database = screen.getByRole('region', { name: 'Banco de dados' })
    expect(within(database).getByText('Respondendo')).toBeVisible()
    expect(within(database).getByText(/^12\s?ms$/)).toBeVisible()
    expect(screen.getByText('2 h 15 min')).toBeVisible()
    expect(screen.getByText(/Atualizado às/)).toBeVisible()
  })

  it('shows days in the uptime after the first day', () => {
    mockHealth({ serverUptimeSeconds: 3 * 86_400 + 4 * 3600 })
    renderPage()

    expect(screen.getByText('3 dias 4 h')).toBeVisible()
  })

  it('shows when the database is down', () => {
    mockHealth({ database: { status: 'down', latencyMs: null } })
    renderPage()

    const database = screen.getByRole('region', { name: 'Banco de dados' })
    expect(within(database).getByText('Fora do ar')).toBeVisible()
    expect(within(database).getByText('—')).toBeVisible()
  })

  it('explains how to enable Sentry when it is not configured', () => {
    renderPage()

    expect(screen.getByText('Sentry não configurado')).toBeVisible()
    expect(screen.getByText(/configure SENTRY_API_TOKEN/)).toBeVisible()
  })

  it('says when Sentry cannot be reached', () => {
    mockHealth({ errorTracking: { configured: true, available: false } })
    renderPage()

    expect(screen.getByText('Não foi possível consultar o Sentry agora.')).toBeVisible()
  })

  it('says when there are no open errors', () => {
    mockHealth({ errorTracking: { configured: true, available: true, issues: [] } })
    renderPage()

    expect(screen.getByText('Nenhum erro aberto nas últimas 24 h.')).toBeVisible()
  })

  it('lists the recent Sentry errors with a link to each one', () => {
    mockHealth({
      errorTracking: {
        configured: true,
        available: true,
        issues: [
          {
            id: '42',
            title: 'TypeError: x is undefined',
            level: 'error',
            eventsCount: 17,
            lastSeen: '2026-10-15T11:58:00.000Z',
            permalink: 'https://sentry.io/organizations/donethink-ct/issues/42/',
          },
          {
            id: '43',
            title: 'Slow query',
            level: 'warning',
            eventsCount: 1,
            lastSeen: '2026-10-15T10:00:00.000Z',
            permalink: 'https://sentry.io/organizations/donethink-ct/issues/43/',
          },
        ],
      },
    })
    renderPage()

    const errors = screen.getByRole('region', { name: 'Erros recentes (Sentry, últimas 24 h)' })
    expect(within(errors).getByText('TypeError: x is undefined')).toBeVisible()
    expect(within(errors).getByText(/^17 ocorrências · última em/)).toBeVisible()
    expect(within(errors).getByText(/^1 ocorrência · última em/)).toBeVisible()
    expect(within(errors).getAllByRole('link', { name: /Abrir no Sentry/ })[0]).toHaveAttribute(
      'href',
      'https://sentry.io/organizations/donethink-ct/issues/42/',
    )
  })

  it('shows a loading indicator and then an error message without inventing data', () => {
    vi.mocked(useSystemHealth).mockReturnValue({ data: undefined, isPending: true, isError: false })
    const view = renderPage()
    expect(screen.getByRole('progressbar')).toBeVisible()
    view.unmount()

    vi.mocked(useSystemHealth).mockReturnValue({ data: undefined, isPending: false, isError: true })
    renderPage()
    expect(screen.getByText('Não foi possível verificar a saúde do sistema agora.')).toBeVisible()
    expect(screen.queryByText('99,9%')).not.toBeInTheDocument()
  })
})
