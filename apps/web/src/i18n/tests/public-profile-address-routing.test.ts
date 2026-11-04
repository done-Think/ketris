import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from '../routing'
import { getPathname } from '../navigation'

describe('public profile address routing', () => {
  it('keeps a root address while rewriting to the negotiated locale', () => {
    const middleware = createMiddleware({
      ...routing,
      localePrefix: 'never',
      alternateLinks: false,
    })
    const response = middleware(
      new NextRequest('https://ketris.test/@alysson', { headers: { 'accept-language': 'es' } }),
    )
    expect(response.headers.get('location')).toBeNull()
    expect(response.headers.get('x-middleware-rewrite')).toBe('https://ketris.test/es-ES/p/alysson')
  })
  it('supports explicit locale and generates localized metadata URLs', () => {
    const response = createMiddleware(routing)(new NextRequest('https://ketris.test/en/@alysson'))
    expect(response.headers.get('x-middleware-rewrite')).toBe('https://ketris.test/en-US/p/alysson')
    expect(
      getPathname({
        locale: 'pt-BR',
        href: { pathname: '/p/[handle]', params: { handle: 'alysson' } },
      }),
    ).toBe('/pt/@alysson')
  })
})
