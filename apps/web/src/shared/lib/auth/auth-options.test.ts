import { describe, expect, it, vi } from 'vitest'

import { InvalidCredentialsError } from '@server/auth/domain/errors'

const executeMock = vi.fn()

// Mocka só o composition root (authContainer) — testa a função `authorize()` do NextAuth isoladamente,
// sem exercitar de novo o LoginUseCase (já coberto por login.use-case.test.ts). Foco aqui: o mapeamento
// LoginOutput -> User do NextAuth, e a conversão de InvalidCredentialsError em `null` (contrato exigido
// pelo CredentialsProvider).
vi.mock('@server/auth/container', () => ({
  authContainer: { loginUseCase: { execute: executeMock } },
}))

async function getAuthorize() {
  const { authOptions } = await import('./auth-options')
  const provider = authOptions.providers[0] as unknown as {
    options: { authorize: (credentials: Record<string, string> | undefined) => Promise<unknown> }
  }
  return provider.options.authorize
}

describe('authOptions — CredentialsProvider.authorize', () => {
  it('retorna null quando faltam email ou senha', async () => {
    const authorize = await getAuthorize()

    expect(await authorize(undefined)).toBeNull()
    expect(await authorize({ email: '', password: '' })).toBeNull()
    expect(executeMock).not.toHaveBeenCalled()
  })

  it('chama o LoginUseCase e mapeia o resultado para o formato de usuário do NextAuth', async () => {
    executeMock.mockResolvedValueOnce({
      user: { id: 'u1', tenantId: 't1', nome: 'Ana', email: 'ana@ketris.dev', papel: 'AGENT' },
      accessToken: 'jwt-fake',
    })

    const authorize = await getAuthorize()
    const result = await authorize({ email: 'ana@ketris.dev', password: 'segredo123' })

    expect(executeMock).toHaveBeenCalledWith({ email: 'ana@ketris.dev', password: 'segredo123' })
    expect(result).toEqual({
      id: 'u1',
      name: 'Ana',
      email: 'ana@ketris.dev',
      accessToken: 'jwt-fake',
      tenantId: 't1',
    })
  })

  it('retorna null (não lança) quando as credenciais são inválidas', async () => {
    executeMock.mockRejectedValueOnce(new InvalidCredentialsError())

    const authorize = await getAuthorize()
    const result = await authorize({ email: 'ana@ketris.dev', password: 'senha-errada' })

    expect(result).toBeNull()
  })

  it('propaga erros inesperados (não mascara falhas de infraestrutura como credencial inválida)', async () => {
    executeMock.mockRejectedValueOnce(new Error('banco fora do ar'))

    const authorize = await getAuthorize()

    await expect(authorize({ email: 'ana@ketris.dev', password: 'x' })).rejects.toThrow(
      'banco fora do ar',
    )
  })
})
