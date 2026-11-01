import type {
  Breadcrumb,
  Envelope,
  ErrorEvent,
  Event,
  Integration,
  Log,
  TransactionEvent,
  TracesSamplerSamplingContext,
  Transport,
} from '@sentry/core'

export const faceCheckPrivateSelector = '[data-face-check-private]'
export const faceCheckDiagnosticMessage = 'face_check.unexpected_failure'
let browserPrivacyBoundary = false

export function isFaceCheckTelemetryReference(value: string): boolean {
  let decoded = value
  for (let count = 0; count < 3; count++) {
    if (/face[_-]?check/i.test(decoded)) return true
    try {
      const next = decodeURIComponent(decoded)
      if (next === decoded) break
      decoded = next
    } catch {
      break
    }
  }
  return /face[_-]?check/i.test(decoded)
}

export function containsFaceCheckTelemetry(value: unknown): boolean {
  const seen = new WeakSet<object>()
  let remaining = 10_000
  function visit(item: unknown, depth: number): boolean {
    if (typeof item === 'string') return isFaceCheckTelemetryReference(item)
    if (
      !item ||
      typeof item !== 'object' ||
      ArrayBuffer.isView(item) ||
      item instanceof ArrayBuffer
    )
      return false
    if (seen.has(item)) return false
    if (depth > 20 || --remaining < 0) return true
    seen.add(item)
    try {
      return Object.entries(item).some(
        ([key, child]) => isFaceCheckTelemetryReference(key) || visit(child, depth + 1),
      )
    } catch {
      return true
    }
  }
  return visit(value, 0)
}

export function faceCheckBrowserPrivacyActive(): boolean {
  return (
    browserPrivacyBoundary ||
    (typeof window !== 'undefined' && isFaceCheckTelemetryReference(window.location.href))
  )
}

export function setFaceCheckBrowserPrivacy(active: boolean) {
  browserPrivacyBoundary = active
}

function isDiagnostic(event: Event) {
  return (
    event.type === undefined &&
    event.message === faceCheckDiagnosticMessage &&
    event.tags?.module === 'face_check' &&
    event.tags?.code === 'INTERNAL_ERROR'
  )
}

/** This final allowlist discards request/body, user, local variables, attachments and replay/trace context. */
export function minimalFaceCheckDiagnostic(event: Event): ErrorEvent {
  return {
    type: undefined,
    ...(event.event_id && /^[a-f0-9]{32}$/i.test(event.event_id)
      ? { event_id: event.event_id }
      : {}),
    ...(typeof event.timestamp === 'number' && Number.isFinite(event.timestamp)
      ? { timestamp: event.timestamp }
      : {}),
    platform: 'javascript',
    level: 'error',
    message: faceCheckDiagnosticMessage,
    tags: { module: 'face_check', code: 'INTERNAL_ERROR' },
  }
}

export function beforeSendFaceCheckEvent(event: ErrorEvent): ErrorEvent | null {
  if (isDiagnostic(event)) return minimalFaceCheckDiagnostic(event)
  return faceCheckBrowserPrivacyActive() || containsFaceCheckTelemetry(event) ? null : event
}

export function beforeSendFaceCheckTransaction(event: TransactionEvent): TransactionEvent | null {
  if (faceCheckBrowserPrivacyActive()) return null
  const spans = event.spans ?? []
  const privateIds = new Set(spans.filter(containsFaceCheckTelemetry).map((span) => span.span_id))
  // Descendants belong to the private request even if their own description omits its URL.
  let changed = true
  while (changed) {
    changed = false
    for (const span of spans) {
      if (
        span.parent_span_id &&
        privateIds.has(span.parent_span_id) &&
        !privateIds.has(span.span_id)
      ) {
        privateIds.add(span.span_id)
        changed = true
      }
    }
  }
  const sanitized = privateIds.size
    ? { ...event, spans: spans.filter((span) => !privateIds.has(span.span_id)) }
    : event
  return containsFaceCheckTelemetry(sanitized) ? null : sanitized
}

export function beforeFaceCheckBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  return faceCheckBrowserPrivacyActive() || containsFaceCheckTelemetry(breadcrumb)
    ? null
    : breadcrumb
}

export function beforeFaceCheckLog(log: Log): Log | null {
  return faceCheckBrowserPrivacyActive() || containsFaceCheckTelemetry(log) ? null : log
}

export function faceCheckTracesSampler(fallback: number) {
  return (context: TracesSamplerSamplingContext) =>
    faceCheckBrowserPrivacyActive() || containsFaceCheckTelemetry(context)
      ? 0
      : context.inheritOrSampleWith(fallback)
}

export function filterFaceCheckEnvelope(envelope: Envelope): Envelope | null {
  const diagnostic = envelope[1].find(
    ([headers, payload]) =>
      headers.type === 'event' &&
      payload &&
      typeof payload === 'object' &&
      'message' in payload &&
      isDiagnostic(payload as Event),
  )
  if (diagnostic) {
    const event = minimalFaceCheckDiagnostic(diagnostic[1] as Event)
    // Never reuse original envelope headers: dynamic sampling context can contain the capture URL.
    return [
      { event_id: event.event_id ?? '0'.repeat(32), sent_at: new Date().toISOString() },
      [[{ type: 'event' }, event]],
    ]
  }
  if (faceCheckBrowserPrivacyActive() || containsFaceCheckTelemetry(envelope)) return null
  return envelope
}

export function protectFaceCheckTransport(transport: Transport): Transport {
  return {
    send: (envelope) => {
      const safe = filterFaceCheckEnvelope(envelope)
      return safe ? transport.send(safe) : Promise.resolve({ statusCode: 200 })
    },
    flush: (timeout) => transport.flush(timeout),
  }
}

/** Replay sends compressed recording envelopes directly through Transport.send, bypassing beforeSend. */
export function faceCheckPrivacyIntegration(): Integration {
  return {
    // SDK integration names appear on every event: keep this name outside the private-route matcher.
    name: 'VerificationPrivacy',
    setup(client) {
      const transport = client.getTransport()
      if (!transport) return
      const original = {
        send: transport.send.bind(transport),
        flush: transport.flush.bind(transport),
      }
      transport.send = protectFaceCheckTransport(original).send
    },
    processEvent(event) {
      if (isDiagnostic(event)) return minimalFaceCheckDiagnostic(event)
      // Integrations run before beforeSendTransaction; use the same child-span filtering here.
      if (event.type === 'transaction')
        return beforeSendFaceCheckTransaction(event as TransactionEvent)
      return faceCheckBrowserPrivacyActive() || containsFaceCheckTelemetry(event) ? null : event
    },
  }
}
