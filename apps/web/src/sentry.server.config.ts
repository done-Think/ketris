import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  // VERCEL_ENV é injetada pela Vercel no build e no runtime.
  environment: process.env.NEXT_PUBLIC_ENV ?? process.env.VERCEL_ENV ?? 'development',

  // 100% em desenvolvimento, 10% em produção.
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

  // Anexa o valor das variáveis locais aos frames do stack trace.
  includeLocalVariables: true,
})
