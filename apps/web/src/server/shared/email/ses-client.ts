import { SESClient } from '@aws-sdk/client-ses'

let cachedClient: SESClient | null = null

export function getSesClient(): SESClient {
  if (cachedClient) {
    return cachedClient
  }

  const region = process.env.AWS_REGION
  if (!region) {
    throw new Error('AWS_REGION não configurado.')
  }

  cachedClient = new SESClient({ region })

  return cachedClient
}

export function getSesFromAddress(): string {
  const fromAddress = process.env.SES_FROM_EMAIL

  if (!fromAddress) {
    throw new Error('SES_FROM_EMAIL não configurado.')
  }

  return fromAddress
}
