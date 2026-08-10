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
        papel: 'AGENT',
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
    expect(user?.papel).toBe('AGENT')
    expect(user?.ativo).toBe(true)
    expect(user).toHaveProperty('senhaHash')
  })

  it('retorna null quando o e-mail não existe em nenhum tenant', async () => {
    const user = await repository.findByEmail('nao-existe-em-lugar-nenhum@ketris.dev')

    expect(user).toBeNull()
  })

  it('findByEmailAndTenant encontra o usuário só dentro do tenant informado', async () => {
    const outroTenant = await prisma.tenant.create({
      data: { nome: 'Outro Tenant', slug: `outro-${randomUUID()}` },
    })

    try {
      const encontrado = await repository.findByEmailAndTenant(tenantId, email)
      const naoEncontrado = await repository.findByEmailAndTenant(outroTenant.id, email)

      expect(encontrado?.email).toBe(email)
      expect(naoEncontrado).toBeNull()
    } finally {
      await prisma.tenant.delete({ where: { id: outroTenant.id } })
    }
  })

  it('create insere um usuário novo e retorna a entidade de domínio mapeada', async () => {
    const novoEmail = `criado-${randomUUID()}@ketris.dev`

    const created = await repository.create({
      tenantId,
      nome: 'Usuário Criado',
      email: novoEmail,
      senhaHash: 'hash-fake',
      papel: 'ADMIN',
    })

    expect(created.id).toEqual(expect.any(String))
    expect(created.email).toBe(novoEmail)
    expect(created.tenantId).toBe(tenantId)
    expect(created.papel).toBe('ADMIN')
    expect(created.ativo).toBe(true)

    const persisted = await repository.findByEmailAndTenant(tenantId, novoEmail)
    expect(persisted?.id).toBe(created.id)
  })

  it('findManyByTenant retorna só os usuários do tenant informado', async () => {
    const outroTenant = await prisma.tenant.create({
      data: { nome: 'Outro Tenant Listagem', slug: `outro-list-${randomUUID()}` },
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

  it('update altera nome, e-mail e papel e retorna a entidade atualizada', async () => {
    const created = await repository.create({
      tenantId,
      nome: 'Antes',
      email: `update-${randomUUID()}@ketris.dev`,
      senhaHash: 'hash-fake',
      papel: 'AGENT',
    })

    const novoEmail = `depois-${randomUUID()}@ketris.dev`
    const updated = await repository.update(created.id, {
      nome: 'Depois',
      email: novoEmail,
      papel: 'OWNER',
    })

    expect(updated.nome).toBe('Depois')
    expect(updated.email).toBe(novoEmail)
    expect(updated.papel).toBe('OWNER')
  })

  it('deactivate marca ativo como false sem remover o registro', async () => {
    const created = await repository.create({
      tenantId,
      nome: 'Para Desativar',
      email: `desativar-${randomUUID()}@ketris.dev`,
      senhaHash: 'hash-fake',
      papel: 'AGENT',
    })

    const deactivated = await repository.deactivate(created.id)

    expect(deactivated.ativo).toBe(false)

    const stillThere = await repository.findById(created.id)
    expect(stillThere).not.toBeNull()
    expect(stillThere?.ativo).toBe(false)
  })
})
