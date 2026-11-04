// @vitest-environment node
import type { Envelope, ErrorEvent, TransactionEvent, Transport } from '@sentry/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  beforeFaceCheckBreadcrumb,
  beforeFaceCheckLog,
  beforeSendFaceCheckEvent,
  beforeSendFaceCheckTransaction,
  containsFaceCheckTelemetry,
  faceCheckDiagnosticMessage,
  faceCheckPrivacyIntegration,
  faceCheckTracesSampler,
  filterFaceCheckEnvelope,
  isFaceCheckTelemetryReference,
  protectFaceCheckTransport,
  setFaceCheckBrowserPrivacy,
} from '../face-check-telemetry-privacy'

const id = 'a'.repeat(32)
const token = 'b'.repeat(64)
const captureUrl = `https://app.test/pt/face_check/verify/${token}`
const event = (changes: Partial<ErrorEvent> = {}): ErrorEvent => ({
  type: undefined,
  event_id: id,
  message: 'Unexpected error',
  ...changes,
})

afterEach(() => setFaceCheckBrowserPrivacy(false))

describe('FaceCheck telemetry delivery boundary', () => {
  it('recognizes public, private, API, stack-frame and encoded module references', () => {
    for (const reference of [
      captureUrl,
      '/en/dashboard/face_check/sessions',
      '/api/face_check/capture/token/liveness',
      '/src/server/face_check/infrastructure/s3-photo-store.ts',
      'GET /api/face_check/sessions/[id]',
      encodeURIComponent(encodeURIComponent(captureUrl)),
      'http://face-check-engine:8080/inspect',
    ])
      expect(isFaceCheckTelemetryReference(reference)).toBe(true)
    expect(isFaceCheckTelemetryReference('/api/properties')).toBe(false)
    expect(
      containsFaceCheckTelemetry({
        exception: {
          values: [
            {
              stacktrace: {
                frames: [
                  {
                    filename: '/server/face_check/verification.ts',
                    vars: { image: 'biometric-bytes' },
                  },
                ],
              },
            },
          ],
        },
      }),
    ).toBe(true)
  })

  it('drops automatic errors with token URLs, local variables, request payloads and user context', () => {
    const sensitive = event({
      request: { url: captureUrl, data: { cpf: '12345678900', image: 'base64-private-photo' } },
      user: { id: 'person' },
      exception: { values: [{ stacktrace: { frames: [{ vars: { selfie: 'private-photo' } }] } }] },
    })
    expect(beforeSendFaceCheckEvent(sensitive)).toBeNull()
    setFaceCheckBrowserPrivacy(true)
    expect(beforeSendFaceCheckEvent(event({ extra: { photo: 'without-route-marker' } }))).toBeNull()
    expect(
      beforeFaceCheckBreadcrumb({ category: 'console', message: 'private person name' }),
    ).toBeNull()
    expect(beforeFaceCheckLog({ level: 'error', message: 'private person name' })).toBeNull()
  })

  it('allows only the explicit static diagnostic after removing every inherited sensitive field', () => {
    const diagnostic = event({
      message: faceCheckDiagnosticMessage,
      tags: { module: 'face_check', code: 'INTERNAL_ERROR', token },
      request: {
        url: captureUrl,
        headers: { authorization: 'secret' },
        data: { image: 'private-photo' },
      },
      user: { id: 'private-user' },
      extra: { cpf: '12345678900' },
      breadcrumbs: [{ data: { url: captureUrl } }],
      contexts: { trace: { trace_id: token.slice(0, 32), span_id: token.slice(0, 16) } },
    })
    setFaceCheckBrowserPrivacy(true)
    expect(beforeSendFaceCheckEvent(diagnostic)).toEqual({
      type: undefined,
      event_id: id,
      platform: 'javascript',
      level: 'error',
      message: faceCheckDiagnosticMessage,
      tags: { module: 'face_check', code: 'INTERNAL_ERROR' },
    })
    const envelope: Envelope = [
      { event_id: id, sent_at: '2026-10-31', trace: { transaction: captureUrl } },
      [
        [{ type: 'event' }, diagnostic],
        [
          { type: 'attachment', length: 4, filename: 'private-selfie.jpg' },
          new Uint8Array([1, 2, 3, 4]),
        ],
      ],
    ]
    const safe = filterFaceCheckEnvelope(envelope)!
    expect(safe[1]).toHaveLength(1)
    const serialized = JSON.stringify(safe)
    for (const secret of [
      token,
      'private-photo',
      'private-user',
      '12345678900',
      'authorization',
      'attachment',
      'transaction',
    ])
      expect(serialized).not.toContain(secret)
  })

  it('preserves a common dashboard transaction while removing FaceCheck access spans and their descendants', async () => {
    const commonSpan = {
      trace_id: id,
      span_id: '1111111111111111',
      start_timestamp: 1,
      data: {},
      description: 'GET /api/properties',
    }
    const privateSpan = {
      trace_id: id,
      span_id: '2222222222222222',
      start_timestamp: 1,
      data: {},
      description: 'GET /api/face_check/access',
    }
    const privateChild = {
      trace_id: id,
      span_id: '3333333333333333',
      parent_span_id: privateSpan.span_id,
      start_timestamp: 1,
      data: { result: 'private-value' },
      description: 'HTTP response processing',
    }
    const transaction: TransactionEvent = {
      type: 'transaction',
      transaction: '/dashboard',
      request: { url: 'https://app.test/pt/dashboard' },
      spans: [privateSpan, commonSpan, privateChild],
    }
    const sanitized = beforeSendFaceCheckTransaction(transaction)!
    expect(sanitized.transaction).toBe('/dashboard')
    expect(sanitized.request).toEqual(transaction.request)
    expect(sanitized.spans).toEqual([commonSpan])
    expect(transaction.spans).toHaveLength(3)
    const integration = faceCheckPrivacyIntegration()
    expect(
      await integration.processEvent!(
        transaction,
        {},
        {} as Parameters<NonNullable<typeof integration.processEvent>>[2],
      ),
    ).toEqual(sanitized)
    const envelope: Envelope = [
      { event_id: id, sent_at: '2026-10-31' },
      [[{ type: 'transaction' }, sanitized]],
    ]
    expect(filterFaceCheckEnvelope(envelope)).toBe(envelope)
  })

  it('still drops private parent transactions and requests and preserves sampling for other parents', () => {
    expect(
      beforeSendFaceCheckTransaction({ type: 'transaction', transaction: '/dashboard/face_check' }),
    ).toBeNull()
    expect(
      beforeSendFaceCheckTransaction({
        type: 'transaction',
        transaction: 'GET /api/session',
        request: { url: captureUrl },
      }),
    ).toBeNull()
    setFaceCheckBrowserPrivacy(true)
    expect(
      beforeSendFaceCheckTransaction({ type: 'transaction', transaction: '/dashboard' }),
    ).toBeNull()
    setFaceCheckBrowserPrivacy(false)
    const ordinary: TransactionEvent = { type: 'transaction', transaction: '/dashboard/properties' }
    expect(beforeSendFaceCheckTransaction(ordinary)).toBe(ordinary)
    const inherit = vi.fn(() => 0.1)
    const sample = faceCheckTracesSampler(0.1)
    expect(
      sample({ name: `GET /api/face_check/capture/${token}`, inheritOrSampleWith: inherit }),
    ).toBe(0)
    expect(inherit).not.toHaveBeenCalled()
    expect(sample({ name: 'GET /api/properties', inheritOrSampleWith: inherit })).toBe(0.1)
  })

  it('filters compressed Replay envelopes at the actual transport and preserves normal telemetry', async () => {
    const send = vi.fn(async () => ({ statusCode: 200 }))
    const original: Transport = { send, flush: async () => true }
    const transport = protectFaceCheckTransport(original)
    const replay = [
      {},
      [
        [{ type: 'replay_event' }, { type: 'replay_event', urls: [captureUrl], replay_id: id }],
        [{ type: 'replay_recording' }, new Uint8Array([120, 156, 1, 2, 3])],
      ],
    ] as Envelope
    await transport.send(replay)
    expect(send).not.toHaveBeenCalled()
    const ordinary: Envelope = [
      { event_id: id, sent_at: '2026-10-31' },
      [[{ type: 'event' }, event({ request: { url: 'https://app.test/api/properties' } })]],
    ]
    await transport.send(ordinary)
    expect(send).toHaveBeenCalledWith(ordinary)
    expect(await transport.flush()).toBe(true)
    expect(beforeSendFaceCheckEvent(ordinary[1][0][1] as ErrorEvent)).toBe(ordinary[1][0][1])
  })

  it('installs the transport guard for all SDK delivery paths including Replay direct sends', async () => {
    const send = vi.fn(async () => ({ statusCode: 200 }))
    const transport: Transport = { send, flush: async () => true }
    const integration = faceCheckPrivacyIntegration()
    integration.setup!({ getTransport: () => transport } as Parameters<
      NonNullable<typeof integration.setup>
    >[0])
    setFaceCheckBrowserPrivacy(true)
    await transport.send([
      {},
      [
        [{ type: 'replay_event' }, { type: 'replay_event', urls: ['https://app.test/dashboard'] }],
        [{ type: 'replay_recording' }, 'compressed-recording'],
      ],
    ] as Envelope)
    expect(send).not.toHaveBeenCalled()
    setFaceCheckBrowserPrivacy(false)
    expect(beforeFaceCheckBreadcrumb({ data: { url: captureUrl } })).toBeNull()
    const crumb = { category: 'navigation', data: { to: '/pt/dashboard/properties' } }
    expect(beforeFaceCheckBreadcrumb(crumb)).toBe(crumb)
  })
})
