import { NextRequest } from 'next/server'
import { describe, expect, it, vi } from 'vitest'

import { UnauthorizedError } from '@server/shared/errors'

import type { PlatformTokenService } from './application/ports/platform-token-service.port'
import { requirePlatformBearerAuth } from './require-platform-bearer-auth'

function buildRequest(headers?: Record<string, string>): NextRequest {
  return new NextRequest('http://localhost/api/platform/admins', { headers })
}

describe('requirePlatformBearerAuth', () => {
  it('lança UnauthorizedError quando não há header Authorization', async () => {
    const tokenService: PlatformTokenService = { sign: vi.fn(), verify: vi.fn() }

    await expect(requirePlatformBearerAuth(buildRequest(), tokenService)).rejects.toThrow(
      UnauthorizedError,
    )
    expect(tokenService.verify).not.toHaveBeenCalled()
  })

  it('lança UnauthorizedError quando o header não é Bearer', async () => {
    const tokenService: PlatformTokenService = { sign: vi.fn(), verify: vi.fn() }

    await expect(
      requirePlatformBearerAuth(buildRequest({ authorization: 'Basic abc123' }), tokenService),
    ).rejects.toThrow(UnauthorizedError)
    expect(tokenService.verify).not.toHaveBeenCalled()
  })

  it('lança UnauthorizedError quando o token é inválido/expirado/de outro escopo', async () => {
    const tokenService: PlatformTokenService = {
      sign: vi.fn(),
      verify: vi.fn().mockRejectedValue(new Error('token não é de platform admin')),
    }

    await expect(
      requirePlatformBearerAuth(
        buildRequest({ authorization: 'Bearer token-invalido' }),
        tokenService,
      ),
    ).rejects.toThrow(UnauthorizedError)
  })

  it('retorna o payload quando o token é válido', async () => {
    const payload = { sub: 'platform-admin-1', scope: 'platform' as const }
    const tokenService: PlatformTokenService = {
      sign: vi.fn(),
      verify: vi.fn().mockResolvedValue(payload),
    }

    const result = await requirePlatformBearerAuth(
      buildRequest({ authorization: 'Bearer token-valido' }),
      tokenService,
    )

    expect(result).toEqual(payload)
    expect(tokenService.verify).toHaveBeenCalledWith('token-valido')
  })
})
