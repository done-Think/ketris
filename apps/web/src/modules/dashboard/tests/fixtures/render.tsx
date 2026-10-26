import { ThemeProvider } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

import { theme } from '@shared/theme/theme'

export function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

export function DashboardTestProviders({
  children,
  client = createTestQueryClient(),
}: {
  children: ReactNode
  client?: QueryClient
}) {
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </QueryClientProvider>
  )
}

export function renderWithProviders(ui: ReactElement) {
  return render(<DashboardTestProviders>{ui}</DashboardTestProviders>)
}
