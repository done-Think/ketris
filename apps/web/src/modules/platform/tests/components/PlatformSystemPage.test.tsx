import { ThemeProvider } from '@mui/material'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LineChartProps } from '@mui/x-charts/LineChart'
import type { BarChartProps } from '@mui/x-charts/BarChart'

import { theme } from '@shared/theme/theme'

import { PlatformSystemPage } from '../../components/PlatformSystemPage'
import { networkTraffic, errorNotifications } from '../../data/platform-system-fixtures'

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
  afterEach(() => vi.useRealTimers())

  it('provides correctly typed chart datasets', () => {
    const traffic: LineChartProps['dataset'] = [...networkTraffic]
    const errors: BarChartProps['dataset'] = [...errorNotifications]
    expect(traffic).toHaveLength(networkTraffic.length)
    expect(errors).toHaveLength(errorNotifications.length)
  })
  it('renders health metrics, charts and fixture logs', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: 'Saúde do Sistema' })).toBeVisible()
    expect(screen.getByText('99,9%')).toBeVisible()
    expect(screen.getByText('45 ms')).toBeVisible()
    expect(screen.getByLabelText('Network traffic chart')).toBeVisible()
    expect(screen.getByText('auth-service')).toBeVisible()
  })

  it('toggles auto-refresh and clears the local console', async () => {
    const user = userEvent.setup()
    renderPage()
    const refresh = screen.getByRole('checkbox', { name: 'Atualização automática (5s)' })
    expect(refresh).toBeChecked()
    await user.click(refresh)
    expect(refresh).not.toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Limpar Console' }))
    expect(screen.getByText('Console limpo.')).toBeVisible()
  })

  it('reloads the demo logs every five seconds, pauses, resumes and cleans up', () => {
    vi.useFakeTimers()
    const clearInterval = vi.spyOn(window, 'clearInterval')
    const view = renderPage()
    const refresh = screen.getByRole('checkbox', { name: 'Atualização automática (5s)' })
    fireEvent.click(screen.getByRole('button', { name: 'Limpar Console' }))
    act(() => vi.advanceTimersByTime(4999))
    expect(screen.getByText('Console limpo.')).toBeVisible()
    act(() => vi.advanceTimersByTime(1))
    expect(screen.getByText('auth-service')).toBeVisible()
    expect(screen.getAllByText('ERROR')).toHaveLength(2)
    expect(screen.getByText(/Autenticação bem-sucedida/)).toBeVisible()
    fireEvent.click(refresh)
    fireEvent.click(screen.getByRole('button', { name: 'Limpar Console' }))
    act(() => vi.advanceTimersByTime(10000))
    expect(screen.getByText('Console limpo.')).toBeVisible()
    expect(clearInterval).toHaveBeenCalledTimes(1)
    fireEvent.click(refresh)
    act(() => vi.advanceTimersByTime(5000))
    expect(screen.getByText('auth-service')).toBeVisible()
    view.unmount()
    expect(clearInterval).toHaveBeenCalledTimes(2)
    clearInterval.mockRestore()
  })
})
