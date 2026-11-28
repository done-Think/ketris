import { InstagramError } from './domain/errors'
import type { InstagramConfig } from './types/instagram'

export function instagramEnabled() {
  return process.env.INSTAGRAM_ENABLED === 'true'
}

export function getInstagramConfig(): InstagramConfig {
  if (!instagramEnabled())
    throw new InstagramError('INSTAGRAM_DISABLED', 'Integração com Instagram indisponível.', 503)
  const appId = process.env.INSTAGRAM_APP_ID ?? ''
  const appSecret = process.env.INSTAGRAM_APP_SECRET ?? ''
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI ?? ''
  const graphVersion = process.env.INSTAGRAM_GRAPH_API_VERSION ?? ''
  const mediaOrigin = process.env.INSTAGRAM_PUBLIC_MEDIA_ORIGIN ?? ''
  const encryptionKey = Buffer.from(process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY ?? '', 'base64')
  if (
    !/^\d+$/.test(appId) ||
    !appSecret ||
    !/^v\d+\.\d+$/.test(graphVersion) ||
    encryptionKey.length !== 32
  ) {
    throw new InstagramError(
      'INSTAGRAM_CONFIGURATION',
      'A integração com Instagram precisa ser configurada.',
      503,
    )
  }
  for (const value of [redirectUri, mediaOrigin]) {
    try {
      if (new URL(value).protocol !== 'https:') throw new Error()
    } catch {
      throw new InstagramError(
        'INSTAGRAM_CONFIGURATION',
        'Configure URLs HTTPS para o Instagram.',
        503,
      )
    }
  }
  if (new URL(redirectUri).origin !== new URL(mediaOrigin).origin) {
    throw new InstagramError(
      'INSTAGRAM_CONFIGURATION',
      'As URLs do Instagram devem usar o mesmo domínio.',
      503,
    )
  }
  return {
    appId,
    appSecret,
    redirectUri,
    graphVersion,
    mediaOrigin: new URL(mediaOrigin).origin,
    encryptionKey,
  }
}

// The request that queues a post keeps polling Meta for this long, inside the route maxDuration.
export const instagramRequestMediaWaitMs = 60_000
