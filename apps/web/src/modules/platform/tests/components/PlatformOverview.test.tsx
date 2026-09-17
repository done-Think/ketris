import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { PlatformOverview } from '../../components/PlatformOverview'
import { PlatformShell } from '../../components/PlatformShell'

vi.mock('@mui/x-charts/LineChart', () => ({
  LineChart: () => <div aria-label="Growth trends chart" />,
}))

vi.mock('@/i18n/navigation', async () => {
  const React = await import('react')

  return {
    usePathname: vi.fn(() => '/platform'),
    Link: React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
      function MockLocalizedLink({ href = '', ...props }, ref) {
        return React.createElement('a', { ...props, href, ref })
      },
    ),
  }
})

function renderOverview() {
  return render(
    <ThemeProvider theme={theme}>
      <PlatformOverview />
    </ThemeProvider>,
  )
}

describe('PlatformOverview', () => {
  it('renders the demonstration metrics, growth chart, alerts and recent tenants', () => {
    renderOverview()

    expect(screen.getByRole('heading', { name: 'Visão geral da plataforma' })).toBeVisible()
    expect(screen.getAllByText('45')[0]).toBeVisible()
    expect(screen.getByText('R$ 89.6k')).toBeVisible()
    expect(screen.getByLabelText('Growth trends chart')).toBeVisible()
    expect(screen.getByText('4 ativos')).toBeVisible()
    expect(screen.getByText('Backup automatizado falhou')).toBeVisible()
    expect(screen.getByText('Apex Brokers S/A')).toBeVisible()
    expect(screen.getByText('Nobre Imobiliária')).toBeVisible()
  })

  it('renders all five fixture tenants in the accessible table', () => {
    renderOverview()

    expect(screen.getByRole('table', { name: 'Tabela de tenants recentes' })).toBeVisible()
    expect(screen.getAllByRole('row')).toHaveLength(6)
  })
})

describe('PlatformShell', () => {
  it('marks Overview as the active platform navigation item', () => {
    render(
      <ThemeProvider theme={theme}>
        <PlatformShell>
          <div>Overview content</div>
        </PlatformShell>
      </ThemeProvider>,
    )

    expect(screen.getAllByRole('link', { name: 'Visão geral' })[0]).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getAllByText('Online')[0]).toBeVisible()
  })
})
