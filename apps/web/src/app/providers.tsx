'use client'

import { CssBaseline, ThemeProvider } from '@mui/material'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import 'dayjs/locale/es'
import 'dayjs/locale/pt-br'
import { SessionProvider } from 'next-auth/react'
import { NextIntlClientProvider, useLocale } from 'next-intl'
import { SnackbarProvider } from 'notistack'
import { useMemo, useState } from 'react'

import type { LocaleProvidersProps, ProvidersProps } from '@/i18n/types/provider.types'
import { HttpClientSessionBridge } from '@shared/components/providers'
import { AuthAvailabilityBoundary } from '@shared/components/layout/AuthAvailabilityBoundary'
import { makeQueryClient } from '@shared/lib/query/query-client'
import { getDatePickerLocaleText, getLocalizedTheme } from '@shared/theme/localized-theme'

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => makeQueryClient())
  const locale = useLocale()
  const theme = useMemo(() => getLocalizedTheme(locale), [locale])

  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SessionProvider>
          <HttpClientSessionBridge />
          <QueryClientProvider client={queryClient}>
            <SnackbarProvider
              maxSnack={3}
              autoHideDuration={2000}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <AuthAvailabilityBoundary>{children}</AuthAvailabilityBoundary>
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
      <LocalizationProvider
        dateAdapter={AdapterDayjs}
        adapterLocale={dayjsAdapterLocale}
        localeText={getDatePickerLocaleText(i18n.locale)}
      >
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
