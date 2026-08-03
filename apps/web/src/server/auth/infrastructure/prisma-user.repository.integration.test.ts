import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import { PrismaUserRepository } from './prisma-user.repository'

describe('PrismaUserRepository (integração)', () => {
  const repository = new PrismaUserRepository()
  const tenantSlug = `test-tenant-${randomUUID()}`
  const email = `usuario-${randomUUID()}@ketris.dev`
  let tenantId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Tenant de Teste', slug: tenantSlug },
    })
    tenantId = tenant.id

    await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Usuário de Teste',
        email,
        senhaHash: 'hash-nao-usado-neste-teste',
        papel: 'CORRETOR',
      },
    })
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  it('encontra um usuário existente por e-mail e mapeia para a entidade de domínio', async () => {
    const user = await repository.findByEmail(email)

    expect(user).not.toBeNull()
    expect(user?.email).toBe(email)
    expect(user?.tenantId).toBe(tenantId)
    expect(user?.papel).toBe('CORRETOR')
    expect(user).toHaveProperty('senhaHash')
  })

  it('retorna null quando o e-mail não existe em nenhum tenant', async () => {
    const user = await repository.findByEmail('nao-existe-em-lugar-nenhum@ketris.dev')

    expect(user).toBeNull()
  })
})
