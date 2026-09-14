import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // NEXT_PUBLIC_VERCEL_ENV ('production' | 'preview' | 'development') é exposta
  // automaticamente pela Vercel — evita marcar deploy real como 'development'.
  environment: process.env.NEXT_PUBLIC_ENV ?? process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development',

  // 100% em desenvolvimento, 10% em produção.
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

  // Session Replay: 10% das sessões e 100% das que tiveram erro.
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    // O replay grava o DOM. Como o app expõe dados de clientes (CRM, propostas,
    // financeiro), o mascaramento fica explícito aqui em vez de implícito no default.
    Sentry.replayIntegration({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
