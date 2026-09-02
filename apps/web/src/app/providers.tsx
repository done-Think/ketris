'use client'

import { useState } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { SnackbarProvider } from 'notistack'
import { SessionProvider } from 'next-auth/react'
import { NextIntlClientProvider } from 'next-intl'
import 'dayjs/locale/es'
import 'dayjs/locale/pt-br'

import type { LocaleProvidersProps, ProvidersProps } from '@/i18n/types/provider.types'
import { HttpClientSessionBridge } from '@shared/components/providers'
import { theme } from '@shared/theme/theme'
import { makeQueryClient } from '@shared/lib/query/query-client'

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => makeQueryClient())

  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SessionProvider>
          <HttpClientSessionBridge />
          <QueryClientProvider client={queryClient}>
            <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
              {children}
            </SnackbarProvider>
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </SessionProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  )
}

export function LocaleProviders({ children, i18n }: LocaleProvidersProps) {
  const dayjsAdapterLocale = getDayjsAdapterLocale(i18n.locale)

  return (
    <NextIntlClientProvider locale={i18n.locale} messages={i18n.messages} timeZone={i18n.timeZone}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={dayjsAdapterLocale}>
        {children}
      </LocalizationProvider>
    </NextIntlClientProvider>
  )
}

function getDayjsAdapterLocale(locale: string) {
  if (locale === 'pt-BR') return 'pt-br'
  if (locale === 'es-ES') return 'es'

  return 'en'
}
