'use client'

import { useState, type ReactNode } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { SnackbarProvider } from 'notistack'
import { SessionProvider } from 'next-auth/react'
import 'dayjs/locale/pt-br'

import { HttpClientSessionBridge } from '@shared/components/providers'
import { theme } from '@shared/theme/theme'
import { makeQueryClient } from '@shared/lib/query/query-client'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient())

  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SessionProvider>
          <HttpClientSessionBridge />
          <QueryClientProvider client={queryClient}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
              <SnackbarProvider
                maxSnack={3}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                {children}
              </SnackbarProvider>
            </LocalizationProvider>
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </SessionProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  )
}
