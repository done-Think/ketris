import { z } from 'zod'
import { suppressTracing, withIsolationScope } from '@sentry/nextjs'
import { getInstagramConfig } from '../config'
import { InstagramError } from '../domain/errors'
import type { InstagramApi } from '../application/ports/instagram-api.port'
import { parseMetaJson } from './meta-json'

const idSchema = z.object({ id: z.string() })
const tokenSchema = z.object({ access_token: z.string(), expires_in: z.number().positive() })
const shortTokenSchema = z.object({
  access_token: z.string(),
  user_id: z.union([z.string(), z.number()]).transform(String),
  permissions: z.union([z.string(), z.array(z.string())]).optional(),
})

export class MetaInstagramApi implements InstagramApi {
  private async request(
    path: string,
    token?: string,
    body?: URLSearchParams | FormData,
    absolute = false,
  ): Promise<unknown> {
    const config = getInstagramConfig()
    try {
      const response = await withIsolationScope(async (scope) => {
        try {
          return await suppressTracing(() =>
            fetch(absolute ? path : `https://graph.instagram.com/${config.graphVersion}/${path}`, {
              method: body ? 'POST' : 'GET',
              body,
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
              signal: AbortSignal.timeout(20_000),
              cache: 'no-store',
              redirect: 'error',
            }),
          )
        } finally {
          scope.clearBreadcrumbs()
        }
      })
      const raw = await response.text()
      const result = parseMetaJson(raw)
      if (!response.ok) {
        const error = z
          .object({ error: z.object({ code: z.number().optional() }).optional() })
          .safeParse(result)
        const code = error.success ? error.data.error?.code : undefined
        throw new InstagramError(
          code === 190 ? 'INSTAGRAM_RECONNECT_REQUIRED' : 'INSTAGRAM_PROVIDER_ERROR',
          undefined,
          502,
        )
      }
      return result
    } catch (error) {
      if (error instanceof InstagramError) throw error
      throw new InstagramError('INSTAGRAM_PROVIDER_UNAVAILABLE', undefined, 502)
    }
  }
  private parse<T extends z.ZodTypeAny>(schema: T, value: unknown): z.output<T> {
    const result = schema.safeParse(value)
    if (!result.success) throw new InstagramError('INSTAGRAM_INVALID_RESPONSE', undefined, 502)
    return result.data
  }
  authorizeUrl(state: string) {
    const config = getInstagramConfig()
    const url = new URL('https://www.instagram.com/oauth/authorize')
    url.search = new URLSearchParams({
      client_id: config.appId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: 'instagram_business_basic,instagram_business_content_publish',
      state,
      force_reauth: 'true',
    }).toString()
    return url.toString()
  }
  async exchange(code: string) {
    const config = getInstagramConfig()
    const payload = new FormData()
    for (const [key, value] of Object.entries({
      client_id: config.appId,
      client_secret: config.appSecret,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri,
      code,
    }))
      payload.set(key, value)
    const short = this.parse(
      z.union([
        shortTokenSchema,
        z
          .object({ data: z.array(shortTokenSchema).length(1) })
          .transform((response) => response.data[0]),
      ]),
      await this.request('https://api.instagram.com/oauth/access_token', undefined, payload, true),
    )
    let permissions =
      typeof short.permissions === 'string' ? short.permissions.split(/[,\s]+/) : short.permissions
    if (!permissions) {
      const response = this.parse(
        z.object({ data: z.array(z.object({ permission: z.string(), status: z.string() })) }),
        await this.request('me/permissions', short.access_token),
      )
      permissions = response.data.filter((p) => p.status === 'granted').map((p) => p.permission)
    }
    if (
      !['instagram_business_basic', 'instagram_business_content_publish'].every((p) =>
        permissions.includes(p),
      )
    ) {
      throw new InstagramError(
        'INSTAGRAM_PERMISSIONS_REQUIRED',
        'Autorize o acesso à conta e a publicação de conteúdo.',
      )
    }
    const token = this.parse(
      tokenSchema,
      await this.request(
        `https://graph.instagram.com/access_token?${new URLSearchParams({ grant_type: 'ig_exchange_token', client_secret: config.appSecret, access_token: short.access_token })}`,
        undefined,
        undefined,
        true,
      ),
    )
    const identity = this.parse(
      z.object({
        user_id: z.union([z.string(), z.number()]).transform(String),
        username: z.string(),
      }),
      await this.request('me?fields=user_id,username', token.access_token),
    )
    return {
      accessToken: token.access_token,
      expiresIn: token.expires_in,
      accountId: identity.user_id,
      oauthUserId: short.user_id,
      username: identity.username,
    }
  }
  async refresh(token: string) {
    const result = this.parse(
      tokenSchema,
      await this.request(
        `https://graph.instagram.com/refresh_access_token?${new URLSearchParams({ grant_type: 'ig_refresh_token', access_token: token })}`,
        undefined,
        undefined,
        true,
      ),
    )
    return { accessToken: result.access_token, expiresIn: result.expires_in }
  }
  async createImage(accountId: string, token: string, url: string, caption = '', child = false) {
    const body = new URLSearchParams({ image_url: url })
    if (child) body.set('is_carousel_item', 'true')
    else body.set('caption', caption)
    return this.parse(idSchema, await this.request(`${accountId}/media`, token, body)).id
  }
  async createCarousel(accountId: string, token: string, children: string[], caption: string) {
    return this.parse(
      idSchema,
      await this.request(
        `${accountId}/media`,
        token,
        new URLSearchParams({ media_type: 'CAROUSEL', children: children.join(','), caption }),
      ),
    ).id
  }
  async containerStatus(id: string, token: string) {
    return this.parse(
      z.object({ status_code: z.string() }),
      await this.request(`${id}?fields=status_code`, token),
    ).status_code
  }
  async publish(accountId: string, token: string, containerId: string) {
    return this.parse(
      idSchema,
      await this.request(
        `${accountId}/media_publish`,
        token,
        new URLSearchParams({ creation_id: containerId }),
      ),
    ).id
  }
  async permalink(id: string, token: string) {
    return (
      this.parse(
        z.object({ permalink: z.string().url().optional() }),
        await this.request(`${id}?fields=permalink`, token),
      ).permalink ?? null
    )
  }
  async checkLimit(accountId: string, token: string) {
    const result = this.parse(
      z.object({
        data: z.array(
          z.object({ quota_usage: z.number(), config: z.object({ quota_total: z.number() }) }),
        ),
      }),
      await this.request(`${accountId}/content_publishing_limit?fields=quota_usage,config`, token),
    )
    if (!result.data.length || result.data.some((row) => row.quota_usage >= row.config.quota_total))
      throw new InstagramError(
        'INSTAGRAM_PUBLISHING_LIMIT',
        'O limite de publicações da conta foi atingido.',
      )
  }
}
