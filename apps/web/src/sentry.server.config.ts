import * as Sentry from '@sentry/nextjs'
import {
  beforeFaceCheckBreadcrumb,
  beforeFaceCheckLog,
  beforeSendFaceCheckEvent,
  beforeSendFaceCheckTransaction,
  faceCheckPrivacyIntegration,
  faceCheckTracesSampler,
} from '@shared/lib/face-check-telemetry-privacy'

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENV ?? process.env.VERCEL_ENV ?? 'development',
  tracesSampler: faceCheckTracesSampler(process.env.NODE_ENV === 'development' ? 1.0 : 0.1),
  beforeSend: beforeSendFaceCheckEvent,
  beforeSendTransaction: beforeSendFaceCheckTransaction,
  beforeBreadcrumb: beforeFaceCheckBreadcrumb,
  beforeSendLog: beforeFaceCheckLog,
  integrations: [faceCheckPrivacyIntegration()],
  includeLocalVariables: true,
})
