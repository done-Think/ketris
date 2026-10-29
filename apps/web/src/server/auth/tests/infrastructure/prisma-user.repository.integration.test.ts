import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import { PrismaUserRepository } from '../../infrastructure/prisma-user.repository'

describe('PrismaUserRepository (integração)', () => {
  const repository = new PrismaUserRepository()
  const tenantSlug = `test-tenant-${randomUUID()}`
  const email = `usuario-${randomUUID()}@ketris.dev`
  let tenantId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Tenant de Teste', slug: tenantSlug },
    })
    tenantId = tenant.id

    await prisma.user.create({
      data: {
        tenantId,
        name: 'Usuário de Teste',
        email,
        passwordHash: 'hash-nao-usado-neste-teste',
        role: 'AGENT',
      },
    })
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  it('findById encontra um usuário existente por id', async () => {
    const user = await repository.findByEmail(email)
    const found = await repository.findById(user!.id)

    expect(found?.email).toBe(email)
  })

  it('findById retorna null quando o id não existe', async () => {
    const found = await repository.findById('id-inexistente')

    expect(found).toBeNull()
  })

  it('encontra um usuário existente por e-mail e mapeia para a entidade de domínio', async () => {
    const user = await repository.findByEmail(email)

    expect(user).not.toBeNull()
    expect(user?.email).toBe(email)
    expect(user?.tenantId).toBe(tenantId)
    expect(user?.role).toBe('AGENT')
    expect(user?.active).toBe(true)
    expect(user).toHaveProperty('passwordHash')
  })

  it('retorna null quando o e-mail não existe em nenhum tenant', async () => {
    const user = await repository.findByEmail('nao-existe-em-lugar-nenhum@ketris.dev')

    expect(user).toBeNull()
  })

  it('permite o mesmo e-mail em tenants distintos e exige desambiguação', async () => {
    const outroTenant = await prisma.tenant.create({
      data: { name: 'Outro Tenant', slug: `outro-${randomUUID()}` },
    })

    try {
      const other = await repository.create({
        tenantId: outroTenant.id,
        name: 'Duplicado',
        email,
        passwordHash: 'hash-fake',
        role: 'AGENT',
      })
      expect(other.tenantId).toBe(outroTenant.id)
      expect(await repository.findByEmail(email)).toBeNull()
      expect((await repository.findByEmail(email, tenantId))?.tenantId).toBe(tenantId)
      expect((await repository.findByEmail(email, outroTenant.id))?.id).toBe(other.id)
      await expect(
        repository.create({
          tenantId,
          name: 'Mesmo tenant',
          email,
          passwordHash: 'hash-fake',
          role: 'AGENT',
        }),
      ).rejects.toMatchObject({ code: 'EMAIL_ALREADY_IN_USE' })
    } finally {
      await prisma.tenant.delete({ where: { id: outroTenant.id } })
    }
  })

  it('conflitos concorrentes do mesmo e-mail resultam em erro de negócio 409', async () => {
    const input = {
      tenantId,
      name: 'Concorrente',
      email: `race-${randomUUID()}@ketris.dev`,
      passwordHash: 'hash-fake',
      role: 'AGENT' as const,
    }
    const results = await Promise.allSettled([repository.create(input), repository.create(input)])
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    const rejected = results.find((result) => result.status === 'rejected')
    expect(rejected?.status === 'rejected' && rejected.reason).toMatchObject({
      code: 'EMAIL_ALREADY_IN_USE',
      status: 409,
    })
    expect(await prisma.user.count({ where: { tenantId, email: input.email } })).toBe(1)
  })

  it('create insere um usuário novo e retorna a entidade de domínio mapeada', async () => {
    const newEmail = `criado-${randomUUID()}@ketris.dev`

    const created = await repository.create({
      tenantId,
      name: 'Usuário Criado',
      email: newEmail,
      passwordHash: 'hash-fake',
      role: 'OWNER',
    })

    expect(created.id).toEqual(expect.any(String))
    expect(created.email).toBe(newEmail)
    expect(created.tenantId).toBe(tenantId)
    expect(created.role).toBe('OWNER')
    expect(created.active).toBe(true)

    const persisted = await repository.findByEmail(newEmail)
    expect(persisted?.id).toBe(created.id)
  })

  it('findManyByTenant retorna só os usuários do tenant informado', async () => {
    const outroTenant = await prisma.tenant.create({
      data: { name: 'Outro Tenant Listagem', slug: `outro-list-${randomUUID()}` },
    })

    try {
      const users = await repository.findManyByTenant(tenantId)

      expect(users.length).toBeGreaterThan(0)
      expect(users.every((user) => user.tenantId === tenantId)).toBe(true)

      const usersOutroTenant = await repository.findManyByTenant(outroTenant.id)
      expect(usersOutroTenant).toEqual([])
    } finally {
      await prisma.tenant.delete({ where: { id: outroTenant.id } })
    }
  })

  it('pagina no tenant e filtra pendentes antes de contar e limitar', async () => {
    const another = await prisma.tenant.create({
      data: { name: 'Fora da lista', slug: `outside-${randomUUID()}` },
    })
    try {
      await prisma.user.createMany({
        data: Array.from({ length: 4 }, (_, index) => ({
          tenantId,
          name: `Pendente ${index}`,
          email: `pending-${randomUUID()}@ketris.dev`,
          passwordHash: 'hash-fake',
          role: 'AGENT' as const,
          membershipApprovedAt: null,
        })),
      })
      await prisma.user.create({
        data: {
          tenantId: another.id,
          name: 'Outro tenant',
          email: `outside-${randomUUID()}@ketris.dev`,
          passwordHash: 'hash-fake',
          role: 'AGENT',
          membershipApprovedAt: null,
        },
      })
      const first = await repository.findPageByTenant(tenantId, {
        page: 1,
        pageSize: 2,
        pendingApproval: true,
      })
      const second = await repository.findPageByTenant(tenantId, {
        page: 2,
        pageSize: 2,
        pendingApproval: true,
      })
      expect(first.total).toBeGreaterThanOrEqual(4)
      expect(first.total).toBe(second.total)
      expect(first.users).toHaveLength(2)
      expect(second.users).toHaveLength(2)
      expect(
        [...first.users, ...second.users].every(
          (user) => user.tenantId === tenantId && user.membershipApprovedAt === null,
        ),
      ).toBe(true)
      expect(new Set([...first.users, ...second.users].map((user) => user.id)).size).toBe(4)
    } finally {
      await prisma.tenant.delete({ where: { id: another.id } })
    }
  })

  it('update altera name, e-mail e role e retorna a entidade atualizada', async () => {
    const created = await repository.create({
      tenantId,
      name: 'Antes',
      email: `update-${randomUUID()}@ketris.dev`,
      passwordHash: 'hash-fake',
      role: 'AGENT',
    })

    const newEmail = `depois-${randomUUID()}@ketris.dev`
    const updated = await repository.update(created.id, {
      name: 'Depois',
      email: newEmail,
      role: 'OWNER',
    })

    expect(updated.name).toBe('Depois')
    expect(updated.email).toBe(newEmail)
    expect(updated.role).toBe('OWNER')
  })

  it('troca de credencial incrementa versão e revoga tokens, respeitando o tenant na escrita', async () => {
    const created = await repository.create({
      tenantId,
      name: 'Credenciais',
      email: `credential-${randomUUID()}@ketris.dev`,
      passwordHash: 'hash-atual',
      role: 'AGENT',
    })
    const token = await prisma.refreshToken.create({
      data: {
        userId: created.id,
        tenantId,
        tokenHash: randomUUID(),
        expiresAt: new Date(Date.now() + 60000),
      },
    })
    await expect(
      repository.update(created.id, {
        passwordHash: 'nao-deve-persistir',
        tenantId: 'outro-tenant',
      }),
    ).rejects.toMatchObject({ code: 'P2025' })
    expect((await repository.findById(created.id))?.passwordHash).toBe('hash-atual')
    expect(
      (await prisma.refreshToken.findUniqueOrThrow({ where: { id: token.id } })).revokedAt,
    ).toBeNull()
    const updated = await repository.update(created.id, { passwordHash: 'novo-hash', tenantId })
    expect(updated.sessionVersion).toBe(1)
    expect(
      (await prisma.refreshToken.findUniqueOrThrow({ where: { id: token.id } })).revokedAt,
    ).not.toBeNull()
  })

  it('deactivate marca ativo como false sem remover o registro', async () => {
    const created = await repository.create({
      tenantId,
      name: 'Para Desativar',
      email: `desativar-${randomUUID()}@ketris.dev`,
      passwordHash: 'hash-fake',
      role: 'AGENT',
    })

    const deactivated = await repository.deactivate(created.id)

    expect(deactivated.active).toBe(false)

    const stillThere = await repository.findById(created.id)
    expect(stillThere).not.toBeNull()
    expect(stillThere?.active).toBe(false)
  })
})
