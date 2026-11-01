import { prisma } from '@server/db/prisma'
import type { FaceCheckDatabase } from './types/access'
import type {
  FaceCheckInvitationEmailResult,
  ProcessFaceCheckInvitationEmailsInput,
} from './types/invitation-email'
import { DataCipher } from './infrastructure/data-cipher'
import { PrismaFaceCheckInvitationRepository } from './infrastructure/prisma-invitation-email-repository'
import { SesFaceCheckInvitationMailer } from './infrastructure/ses-invitation-mailer'
import { FaceCheckInvitationEmailProcessor } from './verification/application/use-cases/invitation-emails'
import { buildCaptureUrlForLocale } from './http/capture-url'
import { buildFaceCheckInvitationEmail } from './notifications/invitation-email'

export async function processFaceCheckInvitationEmails(
  input: ProcessFaceCheckInvitationEmailsInput = {},
  database: FaceCheckDatabase = prisma,
): Promise<FaceCheckInvitationEmailResult> {
  return new FaceCheckInvitationEmailProcessor(
    new PrismaFaceCheckInvitationRepository(database, DataCipher.fromEnvironment()),
    new SesFaceCheckInvitationMailer(),
    buildFaceCheckInvitationEmail,
    buildCaptureUrlForLocale,
  ).execute(input)
}

export async function attemptCreatedFaceCheckInvitationEmail(
  sessionId: string,
  process: typeof processFaceCheckInvitationEmails = processFaceCheckInvitationEmails,
): Promise<void> {
  try {
    await process({ sessionId, limit: 1, budgetMs: 3000 })
  } catch {
    // The session and outbox are already committed. A scheduled worker retries delivery.
  }
}
