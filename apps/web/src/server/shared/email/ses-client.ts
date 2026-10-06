import { SESClient } from '@aws-sdk/client-ses'

let cachedClient: SESClient | null = null

export function getSesClient(): SESClient {
  if (cachedClient) {
    return cachedClient
  }

  const region = process.env.AWS_REGION
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Credenciais da AWS não configuradas (AWS_REGION/AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY).',
    )
  }

  cachedClient = new SESClient({ region, credentials: { accessKeyId, secretAccessKey } })

  return cachedClient
}

export function getSesFromAddress(): string {
  const fromAddress = process.env.SES_FROM_EMAIL

  if (!fromAddress) {
    throw new Error('SES_FROM_EMAIL não configurado.')
  }

  return fromAddress
}
