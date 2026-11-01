// @vitest-environment node
import type { SESClient } from '@aws-sdk/client-ses'
import type { AppLocale } from '@/i18n/types/locale.types'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type {
  FaceCheckInvitationDelivery,
  FaceCheckInvitationJob,
  FaceCheckInvitationRepository,
} from '../types/invitation-email'
import { FaceCheckInvitationEmailProcessor } from '../verification/application/use-cases/invitation-emails'
import { SesFaceCheckInvitationMailer } from '../infrastructure/ses-invitation-mailer'

vi.mock('@server/db/prisma', () => ({ prisma: {} }))
import { attemptCreatedFaceCheckInvitationEmail } from '../invitation-emails'

const now = Date.parse('2026-11-01T12:00:00.000Z')
const job: FaceCheckInvitationJob = {
  id: 'job',
  sessionId: 'session',
  tenantId: 'agency',
  tokenHash: 'hash',
  locale: 'es-ES',
  attempts: 0,
  expiresAt: new Date(now + 86_400_000),
}
const delivery = {
  to: 'candidate@example.test',
  personName: 'Private Candidate',
  agencyName: 'Current agency',
  token: 'a'.repeat(64),
  expiresAt: job.expiresAt.toISOString(),
}

function harness(currentJob = job) {
  const repository = {
    due: vi.fn(async () => [currentJob]),
    claim: vi.fn(async () => true),
    delivery: vi.fn(async (): Promise<FaceCheckInvitationDelivery | null> => delivery),
    complete: vi.fn(async () => true),
    cancel: vi.fn(async () => true),
    retry: vi.fn(async () => {}),
  } satisfies FaceCheckInvitationRepository
  const mailer = { send: vi.fn(async () => {}) }
  const render = vi.fn(() => ({
    subject: 'Invitation',
    text: 'Private link',
    html: '<p>Private link</p>',
  }))
  const link = vi.fn(
    (locale: AppLocale, token: string) =>
      `https://trusted.example.test/${locale}/face_check/verify/${token}`,
  )
  const processor = new FaceCheckInvitationEmailProcessor(
    repository,
    mailer,
    render,
    link,
    () => now,
    () => 0.5,
  )
  return { repository, mailer, render, link, processor }
}

afterEach(() => vi.useRealTimers())

describe('FaceCheck durable invitation delivery', () => {
  it('renders the persisted locale and sends only a successfully claimed eligible job', async () => {
    const h = harness()
    expect(await h.processor.execute({ sessionId: job.sessionId, limit: 1 })).toEqual({
      sent: 1,
      failed: 0,
      cancelled: 0,
    })
    expect(h.repository.due).toHaveBeenCalledWith(
      { sessionId: job.sessionId, limit: 1 },
      new Date(now),
    )
    expect(h.render).toHaveBeenCalledWith({
      locale: 'es-ES',
      personName: delivery.personName,
      agencyName: delivery.agencyName,
      captureUrl: `https://trusted.example.test/es-ES/face_check/verify/${delivery.token}`,
      expiresAt: delivery.expiresAt,
    })
    expect(h.mailer.send).toHaveBeenCalledWith(
      { to: delivery.to, subject: 'Invitation', text: 'Private link', html: '<p>Private link</p>' },
      { signal: expect.any(AbortSignal) },
    )
    expect(h.repository.complete).toHaveBeenCalledWith(job, expect.any(String), new Date(now))
    expect(h.repository.retry).not.toHaveBeenCalled()
  })

  it('does not send a job owned by another worker', async () => {
    const h = harness()
    h.repository.claim.mockResolvedValue(false)
    expect(await h.processor.execute()).toEqual({ sent: 0, failed: 0, cancelled: 0 })
    expect(h.repository.delivery).not.toHaveBeenCalled()
    expect(h.mailer.send).not.toHaveBeenCalled()
  })

  it('cancels jobs that no longer produce an authorized capture link', async () => {
    const h = harness()
    h.repository.delivery.mockResolvedValue(null)
    expect(await h.processor.execute()).toEqual({ sent: 0, failed: 0, cancelled: 1 })
    expect(h.repository.cancel).toHaveBeenCalledWith(job, expect.any(String), new Date(now))
    expect(h.mailer.send).not.toHaveBeenCalled()
  })

  it('persists only a sanitized failure code and bounds retry time by the invitation TTL', async () => {
    const expiring = { ...job, expiresAt: new Date(now + 10_000) }
    const h = harness(expiring)
    h.mailer.send.mockRejectedValue(new Error(`SDK payload ${delivery.to} ${delivery.token}`))
    const result = await h.processor.execute()
    expect(result).toEqual({ sent: 0, failed: 1, cancelled: 0 })
    expect(h.repository.retry).toHaveBeenCalledWith(
      expiring,
      expect.any(String),
      expiring.expiresAt,
      'DELIVERY_FAILED',
      new Date(now),
    )
    expect(JSON.stringify(result)).not.toMatch(/SDK|candidate|payload|token/)
    expect(h.repository.complete).not.toHaveBeenCalled()
  })

  it('does not send a link that expires while its database eligibility check is in flight', async () => {
    const h = harness()
    h.repository.delivery.mockResolvedValue({
      ...delivery,
      expiresAt: new Date(now - 1).toISOString(),
    })
    expect(await h.processor.execute()).toEqual({ sent: 0, failed: 0, cancelled: 1 })
    expect(h.mailer.send).not.toHaveBeenCalled()
  })

  it('backs off repeated delivery failures without busy-looping the same job', async () => {
    const repeated = { ...job, attempts: 20 }
    const h = harness(repeated)
    h.mailer.send.mockRejectedValue(new Error('unavailable'))
    await h.processor.execute()
    expect(h.repository.retry).toHaveBeenCalledWith(
      repeated,
      expect.any(String),
      new Date(now + 3_600_000),
      'DELIVERY_FAILED',
      new Date(now),
    )
    expect(h.mailer.send).toHaveBeenCalledTimes(1)
  })

  it('aborts the transport at its processing budget and keeps the retry durable', async () => {
    vi.useFakeTimers()
    const h = harness()
    h.mailer.send.mockImplementation(
      async (_input?: unknown, options?: { signal: AbortSignal }) => {
        await new Promise<void>((_resolve, reject) =>
          options!.signal.addEventListener('abort', () => reject(new Error('aborted')), {
            once: true,
          }),
        )
      },
    )
    const task = h.processor.execute({ budgetMs: 100 })
    await vi.advanceTimersByTimeAsync(100)
    expect(await task).toEqual({ sent: 0, failed: 1, cancelled: 0 })
    expect(h.repository.retry).toHaveBeenCalledWith(
      job,
      expect.any(String),
      expect.any(Date),
      'DELIVERY_TIMEOUT',
      new Date(now),
    )
  })

  it('reports a lost post-send CAS without issuing another send in the same execution', async () => {
    const h = harness()
    h.repository.complete.mockResolvedValue(false)
    expect(await h.processor.execute()).toEqual({ sent: 0, failed: 1, cancelled: 0 })
    expect(h.mailer.send).toHaveBeenCalledTimes(1)
    expect(h.repository.retry).not.toHaveBeenCalled()
  })

  it('keeps verification creation successful when immediate delivery processing fails', async () => {
    const process = vi.fn(async () => {
      throw new Error('SES or persistence unavailable')
    })
    await expect(
      attemptCreatedFaceCheckInvitationEmail('created-session', process),
    ).resolves.toBeUndefined()
    expect(process).toHaveBeenCalledWith({ sessionId: 'created-session', limit: 1, budgetMs: 3000 })
  })
})

describe('FaceCheck SES adapter', () => {
  it('uses the existing UTF-8 mail contract with the explicit abort signal and one recipient', async () => {
    const send = vi.fn(async () => ({}))
    const client = { send } as unknown as Pick<SESClient, 'send'>
    const mailer = new SesFaceCheckInvitationMailer(client, () => 'verified@example.test')
    const signal = new AbortController().signal
    await mailer.send(
      { to: delivery.to, subject: 'Convite', html: '<p>Olá</p>', text: 'Olá' },
      { signal },
    )
    expect(send.mock.calls[0]).toEqual([
      expect.objectContaining({
        input: {
          Source: 'verified@example.test',
          Destination: { ToAddresses: [delivery.to] },
          Message: {
            Subject: { Data: 'Convite', Charset: 'UTF-8' },
            Body: {
              Html: { Data: '<p>Olá</p>', Charset: 'UTF-8' },
              Text: { Data: 'Olá', Charset: 'UTF-8' },
            },
          },
        },
      }),
      { abortSignal: signal },
    ])
  })

  it('rejects an already aborted send before invoking SES', async () => {
    const send = vi.fn(async () => ({}))
    const controller = new AbortController()
    controller.abort()
    await expect(
      new SesFaceCheckInvitationMailer(
        { send } as unknown as Pick<SESClient, 'send'>,
        () => 'verified@example.test',
      ).send({ to: delivery.to, subject: '', html: '', text: '' }, { signal: controller.signal }),
    ).rejects.toThrow()
    expect(send).not.toHaveBeenCalled()
  })
})
