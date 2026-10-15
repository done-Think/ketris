import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { theme } from '@shared/theme/theme'

import { PlatformSystemPage } from '../../components/PlatformSystemPage'

function renderPage() {
  return render(
    <ThemeProvider theme={theme}>
      <PlatformSystemPage />
    </ThemeProvider>,
  )
}

describe('PlatformSystemPage', () => {
  it('says that infrastructure monitoring is not available yet', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Saúde do Sistema' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Monitoramento em breve' })).toBeVisible()
    expect(
      screen.getByText(/vai aparecer aqui quando uma ferramenta de monitoramento for integrada/),
    ).toBeVisible()
  })

  it('does not show sample health metrics, charts or logs', () => {
    renderPage()

    expect(screen.queryByText('99,9%')).not.toBeInTheDocument()
    expect(screen.queryByText('45 ms')).not.toBeInTheDocument()
    expect(screen.queryByText('auth-service')).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Limpar Console' })).not.toBeInTheDocument()
  })
})
