import { SendEmailCommand } from '@aws-sdk/client-ses'

import { getSesClient, getSesFromAddress } from './ses-client'
import type { Mailer, SendEmailInput } from './mailer.port'

export class SesMailer implements Mailer {
  async send(input: SendEmailInput): Promise<void> {
    const client = getSesClient()

    await client.send(
      new SendEmailCommand({
        Source: getSesFromAddress(),
        Destination: { ToAddresses: [input.to] },
        Message: {
          Subject: { Data: input.subject, Charset: 'UTF-8' },
          Body: {
            Html: { Data: input.html, Charset: 'UTF-8' },
            Text: { Data: input.text, Charset: 'UTF-8' },
          },
        },
      }),
    )
  }
}
