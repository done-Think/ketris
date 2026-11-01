import * as Sentry from '@sentry/nextjs'
import { installFaceCheckBrowserPrivacy } from '@shared/lib/face-check-browser-privacy'
import {
  beforeFaceCheckBreadcrumb,
  beforeFaceCheckLog,
  beforeSendFaceCheckEvent,
  beforeSendFaceCheckTransaction,
  containsFaceCheckTelemetry,
  faceCheckBrowserPrivacyActive,
  faceCheckPrivacyIntegration,
  faceCheckPrivateSelector,
  faceCheckTracesSampler,
} from '@shared/lib/face-check-telemetry-privacy'

const replayOptions: Parameters<typeof Sentry.replayIntegration>[0] = {
  maskAllText: true,
  maskAllInputs: true,
  blockAllMedia: true,
  block: [faceCheckPrivateSelector],
  networkDetailDenyUrls: [/face[_-]?check/i],
  beforeAddRecordingEvent: (event) =>
    faceCheckBrowserPrivacyActive() || containsFaceCheckTelemetry(event) ? null : event,
  beforeErrorSampling: (event) =>
    !faceCheckBrowserPrivacyActive() && !containsFaceCheckTelemetry(event),
}

const privacy = installFaceCheckBrowserPrivacy({
  getReplay: () => Sentry.getReplay(),
  addReplay: () => Sentry.addIntegration(Sentry.replayIntegration(replayOptions)),
  clearBreadcrumbs: () => {
    Sentry.getCurrentScope().clearBreadcrumbs()
    Sentry.getIsolationScope().clearBreadcrumbs()
  },
})

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENV ?? process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development',
  tracesSampler: faceCheckTracesSampler(process.env.NODE_ENV === 'development' ? 1.0 : 0.1),
  beforeSend: beforeSendFaceCheckEvent,
  beforeSendTransaction: beforeSendFaceCheckTransaction,
  beforeBreadcrumb: beforeFaceCheckBreadcrumb,
  beforeSendLog: beforeFaceCheckLog,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    faceCheckPrivacyIntegration(),
    ...(faceCheckBrowserPrivacyActive() ? [] : [Sentry.replayIntegration(replayOptions)]),
  ],
})

export const onRouterTransitionStart = (href: string, navigationType: string) => {
  if (!privacy.transition(href)) Sentry.captureRouterTransitionStart(href, navigationType)
}
