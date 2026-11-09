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

function addReplay() {
  // Without a transport (for example, no local DSN), init does not register integrations.
  // Construct only after the client is enabled: Replay rejects a second construction,
  // even when its first instance was never registered and getReplay() returns undefined.
  if (!Sentry.isEnabled() || Sentry.getReplay()) return
  Sentry.addIntegration(Sentry.replayIntegration(replayOptions))
}

const privacy = installFaceCheckBrowserPrivacy({
  getReplay: () => Sentry.getReplay(),
  addReplay,
  clearBreadcrumbs: () => {
    Sentry.getCurrentScope().clearBreadcrumbs()
    Sentry.getIsolationScope().clearBreadcrumbs()
  },
})

if (!Sentry.isInitialized()) {
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
    integrations: [faceCheckPrivacyIntegration()],
  })
}

if (!faceCheckBrowserPrivacyActive()) addReplay()

export const onRouterTransitionStart = (href: string, navigationType: string) => {
  if (!privacy.transition(href)) Sentry.captureRouterTransitionStart(href, navigationType)
}
