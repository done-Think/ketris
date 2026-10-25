import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '@server/db/prisma'
import { PrismaUserRepository } from '../../infrastructure/prisma-user.repository'

const repository = new PrismaUserRepository()
let tenantId: string
let actorId: string
let platformId: string
beforeAll(async () => {
  const tenant = await prisma.tenant.create({
    data: { nome: 'Auditoria Auth', slug: `audit-${randomUUID()}` },
  })
  tenantId = tenant.id
  const actor = await prisma.usuario.create({
    data: {
      tenantId,
      nome: 'Gestão',
      email: `${randomUUID()}@example.test`,
      senhaHash: 'historical-test-only',
      papel: 'OWNER',
    },
  })
  actorId = actor.id
  const admin = await prisma.platformAdmin.create({
    data: { nome: 'Plataforma', email: `${randomUUID()}@example.test`, senhaHash: 'test-only' },
  })
  platformId = admin.id
})
afterAll(async () => {
  if (tenantId) await prisma.tenant.delete({ where: { id: tenantId } })
  if (platformId) await prisma.platformAdmin.delete({ where: { id: platformId } })
})
const email = () => `${randomUUID()}@audit.example.test`
function input() {
  return {
    tenantId,
    nome: 'Usuário',
    email: email(),
    senhaHash: 'original-password-hash',
    papel: 'AGENT' as const,
    vinculoAprovadoEm: null,
  }
}

describe('histórico transacional dos usuários de Auth', () => {
  it('registra criação, edição, aprovação e inativação com o ator e tenant corretos', async () => {
    const actor = { kind: 'USER' as const, id: actorId }
    const user = await repository.create({ ...input(), auditActor: actor })
    await repository.update(user.id, {
      tenantId,
      nome: 'Novo nome',
      telefone: '(11) 99999-9999',
      auditActor: actor,
    })
    await repository.approveMembership(user.id, tenantId, actor)
    await repository.deactivate(user.id, tenantId, actor)
    const history = await prisma.userAuditEvent.findMany({
      where: { tenantId, userId: user.id },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    })
    expect(history.map((entry) => entry.action)).toEqual([
      'CREATED',
      'UPDATED',
      'MEMBERSHIP_APPROVED',
      'DEACTIVATED',
    ])
    expect(
      history.every(
        (entry) =>
          entry.actorType === 'USER' &&
          entry.actorUserId === actorId &&
          entry.actorPlatformAdminId === null,
      ),
    ).toBe(true)
    expect(history[1].changedFields).toEqual(['name', 'phone'])
    expect((await repository.findById(user.id))?.ativo).toBe(false)
  })
  it('distingue plataforma, autocadastro e sistema e não inventa autoria para contas antigas', async () => {
    const created = await repository.create({
      ...input(),
      auditActor: { kind: 'PLATFORM_ADMIN', id: platformId },
    })
    const entry = await prisma.userAuditEvent.findFirstOrThrow({ where: { userId: created.id } })
    expect(entry.actorType).toBe('PLATFORM_ADMIN')
    expect(entry.actorPlatformAdminId).toBe(platformId)
    expect(entry.actorUserId).toBeNull()
    const self = await repository.create({ ...input(), auditActor: { kind: 'SELF_REGISTRATION' } })
    expect(await prisma.userAuditEvent.findFirst({ where: { userId: self.id } })).toMatchObject({
      actorType: 'SELF_REGISTRATION',
      actorUserId: self.id,
    })
    const system = await repository.create(input())
    expect(await prisma.userAuditEvent.findFirst({ where: { userId: system.id } })).toMatchObject({
      actorType: 'SYSTEM',
      actorUserId: null,
      actorPlatformAdminId: null,
    })
    expect(await prisma.userAuditEvent.count({ where: { userId: actorId } })).toBe(0)
  })
  it('reverte senha, versão e revogação quando não é possível registrar o autor', async () => {
    const user = await repository.create(input())
    const token = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tenantId,
        tokenHash: randomUUID(),
        expiresAt: new Date(Date.now() + 60000),
      },
    })
    await expect(
      repository.update(user.id, {
        tenantId,
        senhaHash: 'changed-password-hash',
        auditActor: { kind: 'USER', id: 'missing-author' },
      }),
    ).rejects.toMatchObject({ code: 'P2003' })
    const unchanged = await prisma.usuario.findUniqueOrThrow({ where: { id: user.id } })
    expect(unchanged.senhaHash).toBe('original-password-hash')
    expect(unchanged.versaoSessao).toBe(0)
    expect(
      (await prisma.refreshToken.findUniqueOrThrow({ where: { id: token.id } })).revokedAt,
    ).toBeNull()
    expect(await prisma.userAuditEvent.count({ where: { userId: user.id } })).toBe(1)
  })
  it('não deixa conta órfã se a autoria falhar e nunca persiste senha/token no evento', async () => {
    const data = input()
    await expect(
      repository.create({ ...data, auditActor: { kind: 'PLATFORM_ADMIN', id: 'missing-admin' } }),
    ).rejects.toMatchObject({ code: 'P2003' })
    expect(await prisma.usuario.count({ where: { tenantId, email: data.email } })).toBe(0)
    const user = await repository.create(input())
    await repository.update(user.id, {
      tenantId,
      senhaHash: 'new-password-hash',
      auditActor: { kind: 'USER', id: actorId },
    })
    const history = await prisma.userAuditEvent.findMany({ where: { userId: user.id } })
    expect(history.some((entry) => entry.changedFields.includes('password'))).toBe(true)
    expect(JSON.stringify(history)).not.toContain('new-password-hash')
    expect(JSON.stringify(history)).not.toContain('original-password-hash')
  })
})
