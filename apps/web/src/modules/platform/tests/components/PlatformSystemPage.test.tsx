import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { PlatformSystemPage } from '../../components/PlatformSystemPage'

vi.mock('@mui/x-charts/LineChart', () => ({
  LineChart: () => <div aria-label="Network traffic chart" />,
}))
vi.mock('@mui/x-charts/BarChart', () => ({
  BarChart: () => <div aria-label="Error notifications chart" />,
}))

function renderPage() {
  return render(
    <ThemeProvider theme={theme}>
      <PlatformSystemPage />
    </ThemeProvider>,
  )
}

describe('PlatformSystemPage', () => {
  it('renders health metrics, charts and fixture logs', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: 'Saúde do Sistema' })).toBeVisible()
    expect(screen.getByText('99.9%')).toBeVisible()
    expect(screen.getByText('45ms')).toBeVisible()
    expect(screen.getByLabelText('Network traffic chart')).toBeVisible()
    expect(screen.getByText('auth-service')).toBeVisible()
  })

  it('toggles auto-refresh and clears the local console', async () => {
    const user = userEvent.setup()
    renderPage()
    const refresh = screen.getByRole('checkbox', { name: 'Auto-refresh (5s)' })
    expect(refresh).toBeChecked()
    await user.click(refresh)
    expect(refresh).not.toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Limpar Console' }))
    expect(screen.getByText('Console limpo.')).toBeVisible()
  })
})
