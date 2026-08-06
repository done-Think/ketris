import { beforeEach, describe, expect, it, vi } from 'vitest'

const prismaMock = vi.hoisted(() => ({
  tenant: {
    findUnique: vi.fn(),
  },
  usuario: {
    findUnique: vi.fn(),
  },
}))
const compareMock = vi.hoisted(() => vi.fn())

vi.mock('@/server/db/prisma', () => ({ prisma: prismaMock }))
vi.mock('bcryptjs', () => ({ default: { compare: compareMock } }))

import { authenticateUser, resolveTenantSlug } from './auth.service'

describe('auth service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('DEFAULT_TENANT_SLUG', 'ketris-demo')
  })

  it('resolve o tenant local usado no desenvolvimento', () => {
    expect(resolveTenantSlug('localhost:3000')).toBe('ketris-demo')
  })

  it('autentica um usuário do tenant quando a senha confere', async () => {
    prismaMock.tenant.findUnique.mockResolvedValue({ id: 'tenant-1' })
    prismaMock.usuario.findUnique.mockResolvedValue({
      id: 'user-1',
      nome: 'Admin Ketris',
      email: 'admin@ketris.dev',
      senhaHash: 'hash',
      tenantId: 'tenant-1',
      papel: 'ADMIN',
    })
    compareMock.mockResolvedValue(true)

    await expect(
      authenticateUser({
        email: 'ADMIN@KETRIS.DEV',
        password: 'senha-correta',
        tenantSlug: 'ketris-demo',
      }),
    ).resolves.toEqual({
      id: 'user-1',
      name: 'Admin Ketris',
      email: 'admin@ketris.dev',
      tenantId: 'tenant-1',
      role: 'ADMIN',
    })
  })

  it('recusa a autenticação com senha incorreta', async () => {
    prismaMock.tenant.findUnique.mockResolvedValue({ id: 'tenant-1' })
    prismaMock.usuario.findUnique.mockResolvedValue({
      id: 'user-1',
      nome: 'Admin Ketris',
      email: 'admin@ketris.dev',
      senhaHash: 'hash',
      tenantId: 'tenant-1',
      papel: 'ADMIN',
    })
    compareMock.mockResolvedValue(false)

    await expect(
      authenticateUser({
        email: 'admin@ketris.dev',
        password: 'senha-incorreta',
        tenantSlug: 'ketris-demo',
      }),
    ).resolves.toBeNull()
  })

  it('recusa a autenticação quando o e-mail não existe no tenant', async () => {
    prismaMock.tenant.findUnique.mockResolvedValue({ id: 'tenant-1' })
    prismaMock.usuario.findUnique.mockResolvedValue(null)

    await expect(
      authenticateUser({
        email: 'inexistente@ketris.dev',
        password: 'qualquer-senha',
        tenantSlug: 'ketris-demo',
      }),
    ).resolves.toBeNull()
    expect(compareMock).not.toHaveBeenCalled()
  })
})
