import type { AppLocale } from '@/i18n/types/locale.types'
import type { Mailer, SendEmailInput } from '@server/shared/email/mailer.port'

export interface FaceCheckInvitationJob {
  id: string
  sessionId: string
  tenantId: string
  tokenHash: string
  locale: AppLocale
  attempts: number
  expiresAt: Date
}

export interface FaceCheckInvitationDelivery {
  to: string
  personName: string
  agencyName: string
  token: string
  expiresAt: string
}

export interface FaceCheckInvitationRepository {
  due(input: { sessionId?: string; limit: number }, now: Date): Promise<FaceCheckInvitationJob[]>
  claim(job: FaceCheckInvitationJob, leaseId: string, until: Date, now: Date): Promise<boolean>
  delivery(
    job: FaceCheckInvitationJob,
    leaseId: string,
    now: Date,
  ): Promise<FaceCheckInvitationDelivery | null>
  complete(job: FaceCheckInvitationJob, leaseId: string, now: Date): Promise<boolean>
  cancel(job: FaceCheckInvitationJob, leaseId: string, now: Date): Promise<boolean>
  retry(
    job: FaceCheckInvitationJob,
    leaseId: string,
    next: Date,
    code: 'DELIVERY_FAILED' | 'DELIVERY_TIMEOUT',
    now: Date,
  ): Promise<void>
}

export interface FaceCheckInvitationMailer extends Mailer {
  send(input: SendEmailInput, options?: { signal: AbortSignal }): Promise<void>
}

export type FaceCheckInvitationRenderer = (input: {
  locale: AppLocale
  personName: string
  agencyName: string
  captureUrl: string
  expiresAt: string
}) => Omit<SendEmailInput, 'to'>

export interface ProcessFaceCheckInvitationEmailsInput {
  sessionId?: string
  limit?: number
  budgetMs?: number
}

export interface FaceCheckInvitationEmailResult {
  sent: number
  failed: number
  cancelled: number
}
