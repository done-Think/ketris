import { NextRequest } from 'next/server'
import { describe, expect, it, vi } from 'vitest'

import { UnauthorizedError } from '@server/shared/errors'

import type { TokenService } from './application/ports/token-service.port'
import { requireBearerAuth } from './require-bearer-auth'

function buildRequest(headers?: Record<string, string>): NextRequest {
  return new NextRequest('http://localhost/api/auth/users', { headers })
}

describe('requireBearerAuth', () => {
  it('lança UnauthorizedError quando não há header Authorization', async () => {
    const tokenService: TokenService = { sign: vi.fn(), verify: vi.fn() }

    await expect(requireBearerAuth(buildRequest(), tokenService)).rejects.toThrow(UnauthorizedError)
    expect(tokenService.verify).not.toHaveBeenCalled()
  })

  it('lança UnauthorizedError quando o header não é Bearer', async () => {
    const tokenService: TokenService = { sign: vi.fn(), verify: vi.fn() }

    await expect(
      requireBearerAuth(buildRequest({ authorization: 'Basic abc123' }), tokenService),
    ).rejects.toThrow(UnauthorizedError)
    expect(tokenService.verify).not.toHaveBeenCalled()
  })

  it('lança UnauthorizedError quando o token é inválido/expirado', async () => {
    const tokenService: TokenService = {
      sign: vi.fn(),
      verify: vi.fn().mockRejectedValue(new Error('token expirado')),
    }

    await expect(
      requireBearerAuth(buildRequest({ authorization: 'Bearer token-invalido' }), tokenService),
    ).rejects.toThrow(UnauthorizedError)
  })

  it('retorna o payload quando o token é válido', async () => {
    const payload = { sub: 'user-1', tenantId: 'tenant-1', papel: 'ADMIN' }
    const tokenService: TokenService = {
      sign: vi.fn(),
      verify: vi.fn().mockResolvedValue(payload),
    }

    const result = await requireBearerAuth(
      buildRequest({ authorization: 'Bearer token-valido' }),
      tokenService,
    )

    expect(result).toEqual(payload)
    expect(tokenService.verify).toHaveBeenCalledWith('token-valido')
  })
})
