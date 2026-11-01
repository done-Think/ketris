import { randomUUID } from 'node:crypto'
import type { AppLocale } from '@/i18n/types/locale.types'
import type {
  FaceCheckInvitationEmailResult,
  FaceCheckInvitationMailer,
  FaceCheckInvitationRenderer,
  FaceCheckInvitationRepository,
  ProcessFaceCheckInvitationEmailsInput,
} from '../../../types/invitation-email'

export class FaceCheckInvitationEmailProcessor {
  constructor(
    private readonly invitations: FaceCheckInvitationRepository,
    private readonly mailer: FaceCheckInvitationMailer,
    private readonly render: FaceCheckInvitationRenderer,
    private readonly captureUrl: (locale: AppLocale, token: string) => string,
    private readonly clock = Date.now,
    private readonly random = Math.random,
  ) {}

  async execute(
    input: ProcessFaceCheckInvitationEmailsInput = {},
  ): Promise<FaceCheckInvitationEmailResult> {
    const limit = Number.isInteger(input.limit) ? Math.min(100, Math.max(1, input.limit!)) : 25
    const budgetMs = Number.isFinite(input.budgetMs)
      ? Math.min(60_000, Math.max(100, input.budgetMs!))
      : 20_000
    const deadline = this.clock() + budgetMs
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), budgetMs)
    timer.unref()
    const result = { sent: 0, failed: 0, cancelled: 0 }
    try {
      const jobs = await this.invitations.due(
        { sessionId: input.sessionId, limit },
        new Date(this.clock()),
      )
      for (const job of jobs) {
        if (controller.signal.aborted || this.clock() >= deadline) break
        const leaseId = randomUUID()
        const claimed = await this.invitations.claim(
          job,
          leaseId,
          new Date(deadline + 5000),
          new Date(this.clock()),
        )
        if (!claimed) continue
        let expiresAt = job.expiresAt.getTime()
        try {
          controller.signal.throwIfAborted()
          // A fresh read under this lease rechecks the issuer, property, tenant and encrypted token.
          const delivery = await this.invitations.delivery(job, leaseId, new Date(this.clock()))
          controller.signal.throwIfAborted()
          if (!delivery || Date.parse(delivery.expiresAt) <= this.clock()) {
            if (await this.invitations.cancel(job, leaseId, new Date(this.clock())))
              result.cancelled += 1
            else result.failed += 1
            continue
          }
          expiresAt = Math.min(expiresAt, Date.parse(delivery.expiresAt))
          const content = this.render({
            locale: job.locale,
            personName: delivery.personName,
            agencyName: delivery.agencyName,
            captureUrl: this.captureUrl(job.locale, delivery.token),
            expiresAt: delivery.expiresAt,
          })
          controller.signal.throwIfAborted()
          if (this.clock() >= deadline) throw new Error('DELIVERY_TIMEOUT')
          await this.mailer.send(
            {
              to: delivery.to,
              subject: content.subject,
              text: content.text,
              html: content.html,
            },
            { signal: controller.signal },
          )
          // SES acceptance and this CAS cannot be atomic. A crash here can cause a rare duplicate.
          if (await this.invitations.complete(job, leaseId, new Date(this.clock())))
            result.sent += 1
          else result.failed += 1
        } catch {
          result.failed += 1
          const now = this.clock()
          const delay = Math.min(
            3_600_000,
            30_000 * 2 ** Math.min(job.attempts, 7) * (0.8 + this.random() * 0.4),
          )
          await this.invitations
            .retry(
              job,
              leaseId,
              new Date(Math.min(expiresAt, now + delay)),
              controller.signal.aborted || now >= deadline ? 'DELIVERY_TIMEOUT' : 'DELIVERY_FAILED',
              new Date(now),
            )
            .catch(() => undefined)
        }
      }
      return result
    } finally {
      clearTimeout(timer)
      controller.abort()
    }
  }
}
