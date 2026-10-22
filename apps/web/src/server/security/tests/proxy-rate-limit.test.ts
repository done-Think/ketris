import { NextRequest } from 'next/server'
import { describe, expect, it, vi } from 'vitest'

import { proxy } from '../../../proxy'

// O roteamento de idioma não participa das rotas /api e o build ESM do next-intl não resolve
// `next/server` no Vitest.
vi.mock('next-intl/middleware', () => ({ default: () => () => new Response(null) }))

function postFrom(ip: string, pathname: string) {
  return new NextRequest(`http://localhost${pathname}`, {
    method: 'POST',
    headers: { 'x-forwarded-for': ip },
  })
}

describe('proxy rate limit', () => {
  it('applies the strict auth policy to the change-password route', () => {
    const ip = '203.0.113.10'
    const statuses = Array.from(
      { length: 11 },
      () => proxy(postFrom(ip, '/api/auth/me/password')).status,
    )

    expect(statuses.slice(0, 10).every((status) => status !== 429)).toBe(true)
    expect(statuses[10]).toBe(429)
  })

  it('keeps regular API routes on the permissive policy', () => {
    const ip = '203.0.113.11'
    const statuses = Array.from({ length: 11 }, () => proxy(postFrom(ip, '/api/crm/leads')).status)

    expect(statuses).not.toContain(429)
  })
})
