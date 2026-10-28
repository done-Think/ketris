import { afterEach, expect, it, vi } from 'vitest'
import { prisma } from '@server/db/prisma'
import { PrismaAgendaEventRepository } from '../../infrastructure/prisma-agenda-event.repository'
import { CreateAgendaEventUseCase } from '../../application/use-cases/create-agenda-event.use-case'
import { PrismaUserRepository } from '@server/auth/infrastructure/prisma-user.repository'
import { PrismaAgendaPropertyLookup } from '../../infrastructure/prisma-agenda-property-lookup'
import { createAgendaFixture } from '../fixtures/agenda-database'

let tenantId: string | undefined
afterEach(async () => {
  vi.useRealTimers()
  if (tenantId) await prisma.tenant.delete({ where: { id: tenantId } })
  tenantId = undefined
})

it('reserva o responsável atomicamente em duas criações simultâneas', async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2031-03-01T08:00:00Z'))
  const data = await createAgendaFixture()
  tenantId = data.tenantId
  const repository = new PrismaAgendaEventRepository()
  const original = repository.hasOverlap.bind(repository)
  let arrived = 0
  let release!: () => void
  const barrier = new Promise<void>((resolve) => {
    release = resolve
  })
  vi.spyOn(repository, 'hasOverlap').mockImplementation(async (...args) => {
    const found = await original(...args)
    arrived += 1
    if (arrived === 2) release()
    await barrier
    return found
  })
  const useCase = new CreateAgendaEventUseCase(
    repository,
    new PrismaUserRepository(),
    new PrismaAgendaPropertyLookup(),
  )
  const input = {
    actorTenantId: data.tenantId,
    actorUserId: data.userId,
    actorRole: 'OWNER' as const,
    title: 'Reunião simultânea',
    type: 'MEETING' as const,
    freeFormPropertyReference: 'Referência do imóvel',
    start: new Date('2031-03-01T15:00:00Z'),
    durationMinutes: 60,
    participantName: 'Cliente',
    participantPhone: '11999999999',
  }
  const results = await Promise.allSettled([useCase.execute(input), useCase.execute(input)])
  expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
  expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1)
  const rejected = results.find((result) => result.status === 'rejected')
  expect(rejected?.status === 'rejected' ? rejected.reason : null).toMatchObject({
    status: 409,
    code: 'CONFLICT',
  })
  expect(await prisma.agendaEvent.count({ where: { tenantId } })).toBe(1)
})

it('impede duas edições simultâneas de mover eventos distintos para o mesmo horário', async () => {
  const data = await createAgendaFixture()
  tenantId = data.tenantId
  const repository = new PrismaAgendaEventRepository()
  const base = {
    tenantId: data.tenantId,
    responsibleId: data.userId,
    createdById: data.userId,
    title: 'Reunião',
    type: 'MEETING' as const,
    participantName: 'Cliente',
    participantPhone: '11999999999',
  }
  const first = await repository.create({
    ...base,
    start: new Date('2031-03-01T15:00:00Z'),
    end: new Date('2031-03-01T16:00:00Z'),
  })
  const second = await repository.create({
    ...base,
    start: new Date('2031-03-01T17:00:00Z'),
    end: new Date('2031-03-01T18:00:00Z'),
  })
  const changes = {
    start: new Date('2031-03-02T15:00:00Z'),
    end: new Date('2031-03-02T16:00:00Z'),
  }
  const results = await Promise.allSettled([
    repository.update(tenantId, first.id, changes, undefined, data.userId),
    repository.update(tenantId, second.id, changes, undefined, data.userId),
  ])
  expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
  const rejected = results.find((result) => result.status === 'rejected')
  expect(rejected?.status === 'rejected' ? rejected.reason : null).toMatchObject({
    status: 409,
    code: 'CONFLICT',
  })
  expect(await prisma.agendaEvent.count({ where: { tenantId, start: changes.start } })).toBe(1)
})
