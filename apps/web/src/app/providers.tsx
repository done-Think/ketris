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
import { NextIntlClientProvider } from 'next-intl'
import 'dayjs/locale/pt-br'

import type { I18nProviderConfig } from '@/i18n/types/provider.types'
import { HttpClientSessionBridge } from '@shared/components/providers'
import { theme } from '@shared/theme/theme'
import { makeQueryClient } from '@shared/lib/query/query-client'

type ProvidersProps = {
  children: ReactNode
  i18n: I18nProviderConfig
}

export function Providers({ children, i18n }: ProvidersProps) {
  const [queryClient] = useState(() => makeQueryClient())

  return (
    <NextIntlClientProvider locale={i18n.locale} messages={i18n.messages} timeZone={i18n.timeZone}>
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
    </NextIntlClientProvider>
  )
}
