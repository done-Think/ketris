import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import type { AuthTestEmail } from '../types/auth-mailbox'

export function createAuthMailbox(port: number) {
  const messages = new Map<string, AuthTestEmail>()
  const server = createServer(async (request, response) => {
    if (request.method !== 'POST') {
      response.writeHead(405)
      response.end()
      return
    }
    let body = ''
    for await (const chunk of request) body += chunk
    const data = new URLSearchParams(body)
    const email = data.get('Destination.ToAddresses.member.1')
    const text = data.get('Message.Body.Text.Data') ?? ''
    const html = data.get('Message.Body.Html.Data') ?? ''
    const code = text.match(/\b\d{6}\b/)?.[0]
    if (data.get('Action') !== 'SendEmail' || !email || !code) {
      response.writeHead(400)
      response.end()
      return
    }
    const confirmationUrl =
      html
        .match(/href="([^"]*\/confirm-email-change\?request=[^"]+)"/)?.[1]
        ?.replace(/&amp;/g, '&') ?? null
    messages.set(email, { code, confirmationUrl })
    response.setHeader('Content-Type', 'text/xml')
    response.end(
      `<SendEmailResponse xmlns="http://ses.amazonaws.com/doc/2010-12-01/"><SendEmailResult><MessageId>${randomUUID()}</MessageId></SendEmailResult><ResponseMetadata><RequestId>${randomUUID()}</RequestId></ResponseMetadata></SendEmailResponse>`,
    )
  })
  return {
    start: () =>
      new Promise<void>((resolve, reject) => {
        server.once('error', reject)
        server.listen(port, '127.0.0.1', resolve)
      }),
    stop: () =>
      new Promise<void>((resolve, reject) => {
        messages.clear()
        server.close((error) => (error ? reject(error) : resolve()))
      }),
    read(email: string) {
      const result = messages.get(email)
      if (!result)
        throw new Error('Nenhuma mensagem recebida pelo simulador local para esta conta de teste.')
      messages.delete(email)
      return result
    },
  }
}
