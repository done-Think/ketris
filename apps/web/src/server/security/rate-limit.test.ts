import { describe, expect, it } from 'vitest'

import { createRateLimitPolicy, InMemoryRateLimitStore } from './rate-limit'

describe('InMemoryRateLimitStore', () => {
  it('permite requisições dentro do limite da janela', () => {
    const store = new InMemoryRateLimitStore()
    const policy = createRateLimitPolicy('api', 2, 60_000)

    const first = store.consume({ key: 'ip-1', policy, now: 1_000 })
    const second = store.consume({ key: 'ip-1', policy, now: 2_000 })

    expect(first.allowed).toBe(true)
    expect(first.remaining).toBe(1)
    expect(second.allowed).toBe(true)
    expect(second.remaining).toBe(0)
  })

  it('bloqueia quando o limite é excedido na mesma janela', () => {
    const store = new InMemoryRateLimitStore()
    const policy = createRateLimitPolicy('auth', 1, 60_000)

    store.consume({ key: 'ip-1', policy, now: 1_000 })
    const blocked = store.consume({ key: 'ip-1', policy, now: 2_000 })

    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retryAfter).toBe(59)
  })

  it('reinicia a contagem após a janela expirar', () => {
    const store = new InMemoryRateLimitStore()
    const policy = createRateLimitPolicy('api', 1, 60_000)

    store.consume({ key: 'ip-1', policy, now: 1_000 })
    const allowed = store.consume({ key: 'ip-1', policy, now: 61_001 })

    expect(allowed.allowed).toBe(true)
    expect(allowed.remaining).toBe(0)
  })

  it('isola contadores por política e chave', () => {
    const store = new InMemoryRateLimitStore()
    const apiPolicy = createRateLimitPolicy('api', 1, 60_000)
    const authPolicy = createRateLimitPolicy('auth', 1, 60_000)

    store.consume({ key: 'ip-1', policy: apiPolicy, now: 1_000 })
    const sameKeyOtherPolicy = store.consume({ key: 'ip-1', policy: authPolicy, now: 2_000 })
    const otherKeySamePolicy = store.consume({ key: 'ip-2', policy: apiPolicy, now: 2_000 })

    expect(sameKeyOtherPolicy.allowed).toBe(true)
    expect(otherKeySamePolicy.allowed).toBe(true)
  })
})
