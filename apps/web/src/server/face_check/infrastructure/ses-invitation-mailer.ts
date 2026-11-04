import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { getSesFromAddress } from '@server/shared/email/ses-client'
import type { SendEmailInput } from '@server/shared/email/mailer.port'
import type { FaceCheckInvitationMailer } from '../types/invitation-email'
import { FaceCheckError } from '../http/errors'

let cachedClient: SESClient | undefined

function invitationClient() {
  if (cachedClient) return cachedClient
  const region = process.env.AWS_REGION
  if (!region) throw new FaceCheckError('EMAIL_DELIVERY_UNAVAILABLE', 503)
  // This client's retries belong to the durable outbox; auth/team keep their existing client.
  cachedClient = new SESClient({
    region,
    maxAttempts: 1,
    requestHandler: { connectionTimeout: 1000, requestTimeout: 2500, throwOnRequestTimeout: true },
  })
  return cachedClient
}

export class SesFaceCheckInvitationMailer implements FaceCheckInvitationMailer {
  constructor(
    private readonly client?: Pick<SESClient, 'send'>,
    private readonly fromAddress = getSesFromAddress,
  ) {}

  async send(input: SendEmailInput, options?: { signal: AbortSignal }): Promise<void> {
    options?.signal.throwIfAborted()
    await (this.client ?? invitationClient()).send(
      new SendEmailCommand({
        Source: this.fromAddress(),
        Destination: { ToAddresses: [input.to] },
        Message: {
          Subject: { Data: input.subject, Charset: 'UTF-8' },
          Body: {
            Html: { Data: input.html, Charset: 'UTF-8' },
            Text: { Data: input.text, Charset: 'UTF-8' },
          },
        },
      }),
      { abortSignal: options?.signal },
    )
  }
}
