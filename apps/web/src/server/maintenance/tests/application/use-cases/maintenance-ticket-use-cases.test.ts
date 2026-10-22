import { describe, expect, it, vi } from 'vitest'
import { ConflictError, ForbiddenError } from '@server/shared/errors'
import {
  MaintenancePropertyNotFoundError,
  MaintenanceTicketNotFoundError,
  MaintenanceAttachmentValidationError,
} from '../../../domain/errors'
import type {
  MaintenanceActor,
  MaintenanceTicket,
  MaintenanceContract,
  MaintenanceAction,
} from '../../../types/maintenance-ticket'
import type { MaintenanceTicketRepository } from '../../../types/maintenance-ticket-repository'
import { CreateMaintenanceTicketUseCase } from '../../../application/use-cases/create-maintenance-ticket.use-case'
import { UpdateMaintenanceTicketUseCase } from '../../../application/use-cases/update-maintenance-ticket.use-case'
import { GetMaintenanceTicketUseCase } from '../../../application/use-cases/get-maintenance-ticket.use-case'
import { ListMaintenanceTicketsUseCase } from '../../../application/use-cases/list-maintenance-tickets.use-case'
import { AddMaintenanceTicketNoteUseCase } from '../../../application/use-cases/add-maintenance-ticket-note.use-case'
import { UploadMaintenanceTicketAttachmentUseCase } from '../../../application/use-cases/upload-maintenance-ticket-attachment.use-case'
import { ListMaintenanceTicketActivitiesUseCase } from '../../../application/use-cases/list-maintenance-ticket-activities.use-case'
import { actOnTicket, deleteTicket, updateTicket } from '../../../application/workflow'
import { canAccessTicket, permissionsFor, publicTicket } from '../../../application/authorization'

function actor(
  role: MaintenanceActor['actorPapel'],
  id = role.toLowerCase(),
  tenantId = 'tenant-1',
): MaintenanceActor {
  return { actorId: id, actorPapel: role, actorTenantId: tenantId, actorName: id }
}
const admin = actor('ADMIN')
const agent = actor('AGENT')
const owner = actor('OWNER')
const renter = actor('RENTER')
const contract: MaintenanceContract = {
  id: 'contract-1',
  code: 'C-1',
  propertyId: 'property-1',
  propertyTitle: 'Property',
  agentId: 'agent',
  ownerId: 'owner',
  renterIds: ['renter'],
  parties: [],
}
const ticket: MaintenanceTicket = {
  id: 'ticket-1',
  tenantId: 'tenant-1',
  propertyId: 'property-1',
  propertyTitle: 'Property',
  contractId: contract.id,
  responsibleId: null,
  responsibleName: null,
  provider: null,
  completedByRole: null,
  deletedAt: null,
  replacementRequests: [],
  category: 'Plumbing',
  priority: 'URGENTE',
  status: 'ABERTO',
  title: 'Leak',
  description: 'Kitchen leak',
  openedById: 'renter',
  openedByName: 'Renter',
  resolvedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  activities: [],
  attachments: [],
  access: { agentId: 'agent', ownerId: 'owner', renterIds: ['renter'], validContract: true },
}
function repository(
  overrides: Partial<MaintenanceTicket> = {},
  methods: Partial<MaintenanceTicketRepository> = {},
): MaintenanceTicketRepository {
  const current = { ...ticket, ...overrides }
  return {
    findContract: vi.fn().mockResolvedValue(contract),
    findUser: vi.fn().mockResolvedValue({ id: 'agent', role: 'AGENT' }),
    options: vi.fn(),
    linkUsers: vi.fn(),
    create: vi.fn().mockResolvedValue(current),
    findMany: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    findById: vi.fn().mockResolvedValue(current),
    findAttachmentTicket: vi.fn().mockResolvedValue(current),
    mutate: vi.fn().mockImplementation(async (_ticket, changes) => ({ ...current, ...changes })),
    addNote: vi.fn(),
    addAttachment: vi.fn(),
    findActivities: vi.fn().mockResolvedValue([]),
    ...methods,
  }
}
describe('Maintenance access', () => {
  it('persists optional appointments and audits staff rescheduling without granting renter editing', async () => {
    const scheduledAt = new Date('2026-10-24T14:00:00Z')
    const repo = repository({ scheduledAt: null, provider: { name: 'Provider' } })
    await expect(
      new CreateMaintenanceTicketUseCase(repo).execute({
        ...renter,
        contractId: contract.id,
        title: 'Leak',
        category: 'Plumbing',
        description: 'Leak',
        priority: 'NORMAL',
        scheduledAt,
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(repo.create).not.toHaveBeenCalled()
    const update = new UpdateMaintenanceTicketUseCase(repo)
    await update.execute({ ...admin, ticketId: ticket.id, scheduledAt })
    expect(repo.mutate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ scheduledAt }),
      expect.objectContaining({
        type: 'EDICAO',
        details: { before: { scheduledAt: null }, after: { scheduledAt } },
      }),
    )
    await expect(
      update.execute({ ...renter, ticketId: ticket.id, scheduledAt }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    await update.execute({ ...admin, ticketId: ticket.id, scheduledAt: null })
    expect(repo.mutate).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ scheduledAt: null }),
      expect.anything(),
    )
  })
  it('allows linked renters to schedule with a provider and audits dates without changing ticket fields', async () => {
    const repo = repository({ provider: { name: 'Selected provider' }, scheduledAt: null })
    const scheduledAt = '2026-10-24T14:00:00.000Z'
    await actOnTicket(repo, renter, ticket.id, { action: 'schedule', scheduledAt })
    expect(repo.mutate).toHaveBeenCalledWith(
      expect.anything(),
      { scheduledAt: new Date(scheduledAt) },
      expect.objectContaining({
        type: 'EDICAO',
        authorId: renter.actorId,
        details: {
          before: { scheduledAt: null },
          after: { scheduledAt },
          provider: 'Selected provider',
        },
      }),
    )
    await expect(
      actOnTicket(repository(), renter, ticket.id, { action: 'schedule', scheduledAt }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    await expect(
      updateTicket(repository(), admin, ticket.id, { scheduledAt: new Date(scheduledAt) }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    await expect(
      actOnTicket(repo, actor('RENTER', 'other'), ticket.id, { action: 'schedule', scheduledAt }),
    ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
    await expect(
      actOnTicket(
        repository({ status: 'RESOLVIDO', provider: { name: 'Provider' } }),
        renter,
        ticket.id,
        { action: 'schedule', scheduledAt },
      ),
    ).rejects.toBeInstanceOf(ConflictError)
  })
  it.each([admin, agent, owner, renter])('allows linked $actorPapel to read', (user) =>
    expect(canAccessTicket(user, ticket)).toBe(true),
  )
  it.each([
    actor('RENTER', 'other'),
    actor('AGENT', 'other'),
    actor('OWNER', 'other'),
    actor('ADMIN', 'admin', 'other-tenant'),
  ])('denies unrelated $actorPapel', async (user) => {
    const repo = repository()
    await expect(
      new GetMaintenanceTicketUseCase(repo).execute({ ...user, ticketId: ticket.id }),
    ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
    await expect(
      new ListMaintenanceTicketActivitiesUseCase(repo).execute({ ...user, ticketId: ticket.id }),
    ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
    await expect(
      new AddMaintenanceTicketNoteUseCase(repo).execute({
        ...user,
        ticketId: ticket.id,
        message: 'test',
      }),
    ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
    await expect(updateTicket(repo, user, ticket.id, { title: 'test' })).rejects.toBeInstanceOf(
      MaintenanceTicketNotFoundError,
    )
    await expect(deleteTicket(repo, user, ticket.id)).rejects.toBeInstanceOf(
      MaintenanceTicketNotFoundError,
    )
    expect(repo.mutate).not.toHaveBeenCalled()
  })
  it('requires explicit links for legacy calls, even when assigned', () => {
    const legacy = {
      ...ticket,
      responsibleId: 'agent',
      contractId: null,
      access: { ...ticket.access, validContract: false },
    }
    expect(canAccessTicket(agent, legacy)).toBe(false)
    expect(canAccessTicket(admin, legacy)).toBe(true)
  })
  it('gives assigned agent access outside property management without giving tenant-wide access', () => {
    expect(
      canAccessTicket(actor('AGENT', 'assigned'), { ...ticket, responsibleId: 'assigned' }),
    ).toBe(true)
    expect(
      canAccessTicket(actor('OWNER', 'assigned'), { ...ticket, responsibleId: 'assigned' }),
    ).toBe(true)
  })
  it('uses server-side scope for pagination and refuses archived lists to non-admin', async () => {
    const repo = repository()
    const useCase = new ListMaintenanceTicketsUseCase(repo)
    await useCase.execute({ tenantId: 'tenant-1', actor: renter, page: 2 })
    expect(repo.findMany).toHaveBeenCalledWith(expect.objectContaining({ actor: renter, page: 2 }))
    await expect(
      useCase.execute({ tenantId: 'tenant-1', actor: renter, archived: true }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    await expect(useCase.execute({ tenantId: 'other', actor: admin })).rejects.toBeInstanceOf(
      ForbiddenError,
    )
  })
  it.each([admin, agent, owner, renter])(
    'allows $actorPapel to create on linked contract',
    async (user) => {
      const repo = repository()
      await new CreateMaintenanceTicketUseCase(repo).execute({
        ...user,
        contractId: contract.id,
        title: 'Leak',
        category: 'Plumbing',
        description: 'Leak',
        priority: 'NORMAL',
      })
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          contractId: contract.id,
          propertyId: contract.propertyId,
          openedById: user.actorId,
        }),
      )
    },
  )
  it('rejects unrelated contracts and property/contract mismatches', async () => {
    const repo = repository()
    const create = new CreateMaintenanceTicketUseCase(repo)
    for (const input of [{ ...actor('RENTER', 'other') }, { ...renter, propertyId: 'wrong' }]) {
      await expect(
        create.execute({
          ...input,
          contractId: contract.id,
          title: 'Leak',
          category: 'Plumbing',
          description: 'Leak',
          priority: 'NORMAL',
        }),
      ).rejects.toBeInstanceOf(MaintenancePropertyNotFoundError)
    }
    expect(repo.create).not.toHaveBeenCalled()
  })
  it('renter can comment on calls opened by others but cannot edit them', async () => {
    const repo = repository({ openedById: 'admin' })
    await new AddMaintenanceTicketNoteUseCase(repo).execute({
      ...renter,
      ticketId: ticket.id,
      message: ' message ',
    })
    expect(repo.addNote).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ message: 'message', authorId: 'renter' }),
    )
    await expect(updateTicket(repo, renter, ticket.id, { title: 'New' })).rejects.toBeInstanceOf(
      ForbiddenError,
    )
  })
  it.each(['ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO_CONFIRMACAO', 'CONTESTADO'] as const)(
    'never lets renters edit original fields in %s',
    async (status) => {
      const repo = repository({ status })
      await expect(
        updateTicket(repo, renter, ticket.id, { title: 'New', description: 'Changed' }),
      ).rejects.toBeInstanceOf(ForbiddenError)
      expect(repo.mutate).not.toHaveBeenCalled()
    },
  )
  it.each(['RESOLVIDO', 'CANCELADO', 'FECHADO'] as const)(
    'locks field edits on %s and allows only renter notes on resolved tickets',
    async (status) => {
      for (const user of [admin, agent, owner, renter]) {
        const repo = repository({ status })
        await expect(updateTicket(repo, user, ticket.id, { title: 'New' })).rejects.toBeInstanceOf(
          ConflictError,
        )
        const note = new AddMaintenanceTicketNoteUseCase(repo).execute({
          ...user,
          ticketId: ticket.id,
          message: 'new',
        })
        if (status === 'RESOLVIDO' && user.actorPapel === 'RENTER') {
          await note
          expect(repo.addNote).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ message: 'new', authorId: user.actorId }),
          )
        } else await expect(note).rejects.toBeInstanceOf(ConflictError)
      }
    },
  )
  it('strips internal membership data from responses', () => {
    expect(publicTicket(ticket, renter)).not.toHaveProperty('access')
    expect(publicTicket(ticket, renter).permissions.edit).toBe(false)
  })
})
describe('Maintenance workflow and audit', () => {
  it.each(['ABERTO', 'RESOLVIDO', 'CANCELADO', 'FECHADO'] as const)(
    'admin links legacy %s calls without changing their lifecycle, including archived calls',
    async (status) => {
      for (const deletedAt of [null, new Date('2026-10-01')]) {
        const repo = repository({ status, deletedAt, contractId: null })
        await actOnTicket(repo, admin, ticket.id, {
          action: 'linkContract',
          contractId: contract.id,
        })
        expect(repo.findById).toHaveBeenCalledWith(admin.actorTenantId, ticket.id, true)
        expect(repo.mutate).toHaveBeenCalledWith(
          expect.anything(),
          { contractId: contract.id },
          expect.objectContaining({
            type: 'EDICAO',
            authorId: admin.actorId,
            details: {
              before: { contractId: null, propertyId: ticket.propertyId },
              after: { contractId: contract.id, propertyId: ticket.propertyId },
            },
          }),
        )
      }
    },
  )
  it.each([agent, owner, renter])('denies contract linking by $actorPapel', async (user) => {
    const repo = repository()
    expect(permissionsFor(user, ticket).linkContract).toBe(false)
    await expect(
      actOnTicket(repo, user, ticket.id, { action: 'linkContract', contractId: contract.id }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect(repo.mutate).not.toHaveBeenCalled()
  })
  it('rejects missing contracts and contracts from another property during regularization', async () => {
    for (const value of [null, { ...contract, propertyId: 'another-property' }]) {
      const repo = repository({}, { findContract: vi.fn().mockResolvedValue(value) })
      await expect(
        actOnTicket(repo, admin, ticket.id, { action: 'linkContract', contractId: contract.id }),
      ).rejects.toBeInstanceOf(MaintenancePropertyNotFoundError)
      expect(repo.findContract).toHaveBeenCalledWith(admin.actorTenantId, contract.id)
      expect(repo.mutate).not.toHaveBeenCalled()
    }
  })
  it.each([agent, owner])('allows $actorPapel to assume only unassigned calls', async (user) => {
    const repo = repository()
    await actOnTicket(repo, user, ticket.id, { action: 'assume' })
    expect(repo.mutate).toHaveBeenCalledWith(
      expect.anything(),
      { responsibleId: user.actorId },
      expect.objectContaining({ type: 'RESPONSAVEL_ALTERADO', authorId: user.actorId }),
    )
    await expect(
      actOnTicket(repository({ responsibleId: 'other' }), user, ticket.id, { action: 'assume' }),
    ).rejects.toBeInstanceOf(ForbiddenError)
  })
  it.each([agent, owner, renter])(
    'only admin can assign or delete, denies $actorPapel',
    async (user) => {
      await expect(
        actOnTicket(repository(), user, ticket.id, { action: 'assign', responsibleId: 'agent' }),
      ).rejects.toBeInstanceOf(ForbiddenError)
      await expect(deleteTicket(repository(), user, ticket.id)).rejects.toBeInstanceOf(
        ForbiddenError,
      )
    },
  )
  it('refuses renter or foreign users as responsible', async () => {
    for (const value of [null, { id: 'renter', role: 'RENTER' }]) {
      const repo = repository({}, { findUser: vi.fn().mockResolvedValue(value) })
      await expect(
        actOnTicket(repo, admin, ticket.id, { action: 'assign', responsibleId: 'invalid' }),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }
  })
  it('soft deletes without changing status and restores without removing history', async () => {
    const repo = repository({ status: 'EM_ANDAMENTO' })
    await deleteTicket(repo, admin, ticket.id)
    expect(repo.mutate).toHaveBeenCalledWith(
      expect.anything(),
      { deletedAt: expect.any(Date), deletedById: 'admin' },
      expect.objectContaining({ type: 'EXCLUSAO' }),
    )
    const archived = repository({ status: 'EM_ANDAMENTO', deletedAt: new Date() })
    await actOnTicket(archived, admin, ticket.id, { action: 'restore' })
    expect(archived.mutate).toHaveBeenCalledWith(
      expect.anything(),
      { deletedAt: null, deletedById: null },
      expect.objectContaining({ type: 'RESTAURACAO' }),
    )
    expect(canAccessTicket(renter, { ...ticket, deletedAt: new Date() })).toBe(false)
  })
  it.each(['ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO_CONFIRMACAO', 'CONTESTADO'] as const)(
    'lets a linked renter finish %s directly with audit and no assignment',
    async (status) => {
      const repo = repository({ status, openedById: 'admin', responsibleId: null, provider: null })
      expect(permissionsFor(renter, { ...ticket, status })).toMatchObject({
        finish: true,
        edit: false,
        delete: false,
        confirm: false,
      })
      await actOnTicket(repo, renter, ticket.id, { action: 'finish' })
      expect(repo.mutate).toHaveBeenCalledWith(
        expect.anything(),
        {
          status: 'RESOLVIDO',
          resolvedAt: expect.any(Date),
          completedByRole: 'RENTER',
          completedById: renter.actorId,
        },
        expect.objectContaining({
          type: 'MUDANCA_STATUS',
          authorId: renter.actorId,
          details: {
            before: status,
            after: 'RESOLVIDO',
            resolvedAt: expect.any(String),
            previousCompletionRole: null,
          },
        }),
      )
    },
  )
  it.each(['RESOLVIDO', 'CANCELADO', 'FECHADO'] as const)(
    'blocks renter finalization in %s',
    async (status) => {
      const repo = repository({ status })
      await expect(
        actOnTicket(repo, renter, ticket.id, { action: 'finish' }),
      ).rejects.toBeInstanceOf(ConflictError)
      expect(repo.mutate).not.toHaveBeenCalled()
    },
  )
  it.each([actor('RENTER', 'other'), actor('RENTER', 'renter', 'other-tenant')])(
    'blocks unrelated renter finalization',
    async (user) => {
      const repo = repository()
      await expect(actOnTicket(repo, user, ticket.id, { action: 'finish' })).rejects.toBeInstanceOf(
        MaintenanceTicketNotFoundError,
      )
      expect(repo.mutate).not.toHaveBeenCalled()
    },
  )
  it('blocks finalization of archived or unlinked tickets', async () => {
    for (const overrides of [
      { deletedAt: new Date() },
      { contractId: null, access: { ...ticket.access, validContract: false } },
    ]) {
      const repo = repository(overrides)
      await expect(
        actOnTicket(repo, renter, ticket.id, { action: 'finish' }),
      ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
      expect(repo.mutate).not.toHaveBeenCalled()
    }
  })
  it.each([admin, agent, owner])(
    'keeps $actorPapel on the existing completion workflow',
    async (user) => {
      const repo = repository({ responsibleId: user.actorId, status: 'EM_ANDAMENTO' })
      await expect(actOnTicket(repo, user, ticket.id, { action: 'finish' })).rejects.toBeInstanceOf(
        ForbiddenError,
      )
      expect(repo.mutate).not.toHaveBeenCalled()
    },
  )
  it('linked agent must be assigned to start or complete', async () => {
    await expect(
      actOnTicket(repository(), agent, ticket.id, { action: 'start' }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    await expect(
      actOnTicket(repository({ status: 'EM_ANDAMENTO' }), agent, ticket.id, { action: 'complete' }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    const repo = repository({ responsibleId: 'agent', status: 'EM_ANDAMENTO' })
    await actOnTicket(repo, agent, ticket.id, { action: 'complete' })
    expect(repo.mutate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'AGUARDANDO_CONFIRMACAO', completedByRole: 'AGENT' }),
      expect.objectContaining({
        details: { before: 'EM_ANDAMENTO', after: 'AGUARDANDO_CONFIRMACAO' },
      }),
    )
  })
  it('owner cannot confirm an owner-completed repair', async () => {
    await expect(
      actOnTicket(
        repository({ status: 'AGUARDANDO_CONFIRMACAO', completedByRole: 'OWNER' }),
        owner,
        ticket.id,
        { action: 'confirm' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError)
    const repo = repository({ status: 'AGUARDANDO_CONFIRMACAO', completedByRole: 'OWNER' })
    await actOnTicket(repo, admin, ticket.id, { action: 'confirm' })
    expect(repo.mutate).toHaveBeenCalledWith(
      expect.anything(),
      { status: 'RESOLVIDO', resolvedAt: expect.any(Date) },
      expect.anything(),
    )
  })
  it('owner can confirm agent repair and contest with mandatory reason', async () => {
    const pending = { status: 'AGUARDANDO_CONFIRMACAO' as const, completedByRole: 'AGENT' as const }
    await actOnTicket(repository(pending), owner, ticket.id, { action: 'confirm' })
    await expect(
      actOnTicket(repository(pending), owner, ticket.id, { action: 'contest', reason: ' ' }),
    ).rejects.toBeInstanceOf(ConflictError)
    const repo = repository(pending)
    await actOnTicket(repo, owner, ticket.id, { action: 'contest', reason: 'Still leaking' })
    expect(repo.mutate).toHaveBeenCalledWith(
      expect.anything(),
      { status: 'CONTESTADO', resolvedAt: null },
      expect.objectContaining({ message: 'Still leaking', authorId: 'owner' }),
    )
  })
  it('linked renter contests a pending resolution with an audited reason even when opened by someone else', async () => {
    const repo = repository({ status: 'AGUARDANDO_CONFIRMACAO', openedById: 'owner' })
    const pending = await repo.findById('tenant-1', ticket.id)
    expect(permissionsFor(renter, pending!)).toMatchObject({ contest: true, confirm: false })
    await actOnTicket(repo, renter, ticket.id, { action: 'contest', reason: 'Still leaking' })
    expect(repo.mutate).toHaveBeenCalledWith(
      expect.anything(),
      { status: 'CONTESTADO', resolvedAt: null },
      expect.objectContaining({
        authorId: 'renter',
        message: 'Still leaking',
        details: { before: 'AGUARDANDO_CONFIRMACAO', after: 'CONTESTADO' },
      }),
    )
  })
  it('requires a reason and still denies renter confirmation while pending', async () => {
    const repo = repository({ status: 'AGUARDANDO_CONFIRMACAO' })
    await expect(
      actOnTicket(repo, renter, ticket.id, { action: 'contest', reason: ' ' }),
    ).rejects.toBeInstanceOf(ConflictError)
    await expect(
      actOnTicket(repo, renter, ticket.id, { action: 'confirm' }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect(repo.mutate).not.toHaveBeenCalled()
  })
  it.each(['ABERTO', 'EM_ANDAMENTO', 'CONTESTADO', 'RESOLVIDO', 'CANCELADO', 'FECHADO'] as const)(
    'blocks renter contestation in %s',
    async (status) => {
      const repo = repository({ status })
      await expect(
        actOnTicket(repo, renter, ticket.id, { action: 'contest', reason: 'Still leaking' }),
      ).rejects.toThrow()
      expect(repo.mutate).not.toHaveBeenCalled()
    },
  )
  it.each([actor('RENTER', 'other'), actor('RENTER', 'renter', 'other-tenant')])(
    'blocks contestation by unrelated renters',
    async (user) => {
      const repo = repository({ status: 'AGUARDANDO_CONFIRMACAO' })
      await expect(
        actOnTicket(repo, user, ticket.id, { action: 'contest', reason: 'Denied' }),
      ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
      expect(repo.mutate).not.toHaveBeenCalled()
    },
  )
  it('blocks renter contestation of archived or unlinked tickets', async () => {
    for (const overrides of [
      { deletedAt: new Date() },
      { contractId: null, access: { ...ticket.access, validContract: false } },
    ]) {
      const repo = repository({ status: 'AGUARDANDO_CONFIRMACAO', ...overrides })
      await expect(
        actOnTicket(repo, renter, ticket.id, { action: 'contest', reason: 'Denied' }),
      ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
      expect(repo.mutate).not.toHaveBeenCalled()
    }
  })
  it('renter reopens resolved calls with a reason and preserves resolution metadata in the audit', async () => {
    const resolvedAt = new Date('2026-10-19T10:00:00Z')
    const repo = repository({
      status: 'RESOLVIDO',
      resolvedAt,
      completedByRole: 'AGENT',
      openedById: 'admin',
    })
    await actOnTicket(repo, renter, ticket.id, {
      action: 'reopen',
      status: 'ABERTO',
      reason: '  Leak returned  ',
    })
    expect(repo.mutate).toHaveBeenCalledWith(
      expect.anything(),
      { status: 'ABERTO', resolvedAt: null, completedById: null, completedByRole: null },
      expect.objectContaining({
        authorId: 'renter',
        message: 'Leak returned',
        details: {
          before: 'RESOLVIDO',
          after: 'ABERTO',
          reason: 'Leak returned',
          previousResolution: { resolvedAt: resolvedAt.toISOString(), completedByRole: 'AGENT' },
        },
      }),
    )
  })
  it.each([undefined, '', ' '])('requires a renter reopening reason: %s', async (reason) => {
    const repo = repository({ status: 'RESOLVIDO' })
    await expect(
      actOnTicket(repo, renter, ticket.id, { action: 'reopen', status: 'ABERTO', reason }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(repo.mutate).not.toHaveBeenCalled()
  })
  it('does not let renters reopen directly into in-progress status', async () => {
    const repo = repository({ status: 'RESOLVIDO' })
    await expect(
      actOnTicket(repo, renter, ticket.id, {
        action: 'reopen',
        status: 'EM_ANDAMENTO',
        reason: 'Leak returned',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect(repo.mutate).not.toHaveBeenCalled()
  })
  it.each([
    'ABERTO',
    'EM_ANDAMENTO',
    'AGUARDANDO_CONFIRMACAO',
    'CONTESTADO',
    'CANCELADO',
    'FECHADO',
  ] as const)('denies renter reopening in %s', async (status) => {
    const repo = repository({ status })
    await expect(
      actOnTicket(repo, renter, ticket.id, {
        action: 'reopen',
        status: 'ABERTO',
        reason: 'Denied',
      }),
    ).rejects.toThrow()
    expect(repo.mutate).not.toHaveBeenCalled()
  })
  it.each([actor('RENTER', 'other'), actor('RENTER', 'renter', 'other-tenant')])(
    'denies unrelated renter notes and reopening on resolved tickets',
    async (user) => {
      const repo = repository({ status: 'RESOLVIDO' })
      await expect(
        actOnTicket(repo, user, ticket.id, {
          action: 'reopen',
          status: 'ABERTO',
          reason: 'Denied',
        }),
      ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
      await expect(
        new AddMaintenanceTicketNoteUseCase(repo).execute({
          ...user,
          ticketId: ticket.id,
          message: 'Denied',
        }),
      ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
      expect(repo.mutate).not.toHaveBeenCalled()
      expect(repo.addNote).not.toHaveBeenCalled()
    },
  )
  it('denies renter notes and reopening for archived or unlinked resolved tickets', async () => {
    for (const overrides of [
      { deletedAt: new Date() },
      { contractId: null, access: { ...ticket.access, validContract: false } },
    ]) {
      const repo = repository({ status: 'RESOLVIDO', ...overrides })
      await expect(
        actOnTicket(repo, renter, ticket.id, {
          action: 'reopen',
          status: 'ABERTO',
          reason: 'Denied',
        }),
      ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
      await expect(
        new AddMaintenanceTicketNoteUseCase(repo).execute({
          ...renter,
          ticketId: ticket.id,
          message: 'Denied',
        }),
      ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
      expect(repo.mutate).not.toHaveBeenCalled()
      expect(repo.addNote).not.toHaveBeenCalled()
    }
  })
  it('responsible resumes contested calls and admin keeps its reopening permissions', async () => {
    await actOnTicket(
      repository({ status: 'CONTESTADO', responsibleId: 'agent' }),
      agent,
      ticket.id,
      { action: 'start' },
    )
    for (const status of ['ABERTO', 'EM_ANDAMENTO'] as const) {
      const repo = repository({ status: 'CANCELADO' })
      await actOnTicket(repo, admin, ticket.id, { action: 'reopen', status })
      expect(repo.mutate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ status, completedByRole: null }),
        expect.anything(),
      )
    }
    await expect(
      actOnTicket(repository({ status: 'RESOLVIDO' }), owner, ticket.id, {
        action: 'reopen',
        status: 'ABERTO',
      }),
    ).rejects.toBeInstanceOf(ConflictError)
  })
  it.each([owner])('$actorPapel cannot directly define provider', async (user) => {
    await expect(
      actOnTicket(repository(), user, ticket.id, {
        action: 'provider',
        provider: { name: 'Vendor' },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError)
  })
  it.each(['ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO_CONFIRMACAO', 'CONTESTADO'] as const)(
    'lets a linked renter define a provider in %s and audits previous and new values',
    async (status) => {
      const previous = { name: 'Previous provider' }
      const provider = {
        name: 'Chosen provider',
        phone: '51999990000',
        email: 'provider@example.test',
        notes: 'Plumbing',
      }
      const repo = repository({ status, openedById: 'admin', provider: previous })
      expect(permissionsFor(renter, { ...ticket, status }).provider).toBe(true)
      await actOnTicket(repo, renter, ticket.id, { action: 'provider', provider })
      expect(repo.mutate).toHaveBeenCalledWith(
        expect.anything(),
        { provider },
        expect.objectContaining({
          type: 'PRESTADOR_ALTERADO',
          authorId: renter.actorId,
          details: { before: previous, after: provider },
        }),
      )
    },
  )
  it.each(['RESOLVIDO', 'CANCELADO', 'FECHADO'] as const)(
    'blocks renter provider assignment in %s',
    async (status) => {
      const repo = repository({ status })
      await expect(
        actOnTicket(repo, renter, ticket.id, { action: 'provider', provider: { name: 'Denied' } }),
      ).rejects.toBeInstanceOf(ConflictError)
      expect(repo.mutate).not.toHaveBeenCalled()
    },
  )
  it.each([actor('RENTER', 'other'), actor('RENTER', 'renter', 'other-tenant')])(
    'denies unrelated renter provider assignment',
    async (user) => {
      const repo = repository()
      await expect(
        actOnTicket(repo, user, ticket.id, { action: 'provider', provider: { name: 'Denied' } }),
      ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
      expect(repo.mutate).not.toHaveBeenCalled()
    },
  )
  it('blocks renter provider assignment on archived or unlinked tickets', async () => {
    for (const overrides of [
      { deletedAt: new Date() },
      { contractId: null, access: { ...ticket.access, validContract: false } },
    ]) {
      const repo = repository(overrides)
      await expect(
        actOnTicket(repo, renter, ticket.id, { action: 'provider', provider: { name: 'Denied' } }),
      ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
      expect(repo.mutate).not.toHaveBeenCalled()
    }
  })
  it('assigned agent may set a provider, owner requests and admin decides with snapshots', async () => {
    const provider = { name: 'Old' }
    const repo = repository({ responsibleId: 'agent', provider })
    await actOnTicket(repo, agent, ticket.id, { action: 'provider', provider: { name: 'New' } })
    expect(repo.mutate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ provider: expect.objectContaining({ name: 'New' }) }),
      expect.objectContaining({ details: expect.objectContaining({ before: provider }) }),
    )
    const requestRepo = repository({ provider })
    await actOnTicket(requestRepo, owner, ticket.id, {
      action: 'requestReplacement',
      reason: 'Unreliable',
    })
    expect(requestRepo.mutate).toHaveBeenCalledWith(
      expect.anything(),
      {},
      expect.objectContaining({ type: 'TROCA_SOLICITADA' }),
      expect.objectContaining({ kind: 'request', reason: 'Unreliable' }),
    )
    const pending = {
      id: 'request-1',
      reason: 'Unreliable',
      requestedById: 'owner',
      requestedByName: 'Owner',
      status: 'PENDENTE' as const,
      decisionReason: null,
      decidedByName: null,
      decidedAt: null,
      createdAt: new Date(),
    }
    const decisionRepo = repository({ provider, replacementRequests: [pending] })
    await actOnTicket(decisionRepo, admin, ticket.id, {
      action: 'approveReplacement',
      requestId: pending.id,
      provider: { name: 'New' },
    })
    expect(decisionRepo.mutate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ provider: expect.objectContaining({ name: 'New' }) }),
      expect.objectContaining({
        details: expect.objectContaining({ before: provider, approved: true }),
      }),
      expect.objectContaining({ kind: 'decision', approved: true }),
    )
    await expect(
      actOnTicket(decisionRepo, admin, ticket.id, {
        action: 'rejectReplacement',
        requestId: pending.id,
        reason: '',
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    await expect(
      actOnTicket(decisionRepo, owner, ticket.id, {
        action: 'approveReplacement',
        requestId: pending.id,
        provider: { name: 'New' },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    await expect(
      actOnTicket(decisionRepo, admin, ticket.id, {
        action: 'provider',
        provider: { name: 'New' },
      }),
    ).rejects.toBeInstanceOf(ConflictError)
  })
  it('renter cannot change status or request replacement', async () => {
    const actions: MaintenanceAction[] = [
      { action: 'start' },
      { action: 'complete' },
      { action: 'confirm' },
      { action: 'contest', reason: 'No' },
      { action: 'cancel' },
      { action: 'requestReplacement', reason: 'No' },
    ]
    for (const action of actions)
      await expect(
        actOnTicket(repository({ provider: { name: 'Vendor' } }), renter, ticket.id, action),
      ).rejects.toBeInstanceOf(ForbiddenError)
  })
  it('blocks attachment uploads before storage access when unauthorized or terminal', async () => {
    const storage = { upload: vi.fn().mockResolvedValue({ url: 'file', contentType: 'image/png' }) }
    const input = {
      ...renter,
      ticketId: ticket.id,
      filename: 'photo.png',
      contentType: 'image/png',
      body: Buffer.from('photo'),
    }
    await expect(
      new UploadMaintenanceTicketAttachmentUseCase(
        repository({ status: 'RESOLVIDO' }),
        storage,
      ).execute(input),
    ).rejects.toBeInstanceOf(ConflictError)
    await expect(
      new UploadMaintenanceTicketAttachmentUseCase(repository(), storage).execute({
        ...input,
        actorId: 'other',
      }),
    ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
    expect(storage.upload).not.toHaveBeenCalled()
  })
  it.each([
    { body: Buffer.alloc(0), contentType: 'image/png' },
    { body: Buffer.alloc(8 * 1024 * 1024 + 1), contentType: 'image/png' },
    { body: Buffer.from('text'), contentType: 'text/plain' },
  ])('keeps attachment format and size validation', async (invalid) => {
    const storage = { upload: vi.fn() }
    const useCase = new UploadMaintenanceTicketAttachmentUseCase(repository(), storage)
    await expect(
      useCase.execute({ ...renter, ticketId: ticket.id, filename: 'photo.png', ...invalid }),
    ).rejects.toBeInstanceOf(MaintenanceAttachmentValidationError)
    expect(storage.upload).not.toHaveBeenCalled()
  })
  it('allows linked renter to attach even on calls opened by admin', async () => {
    const repo = repository({ openedById: 'admin' })
    const storage = { upload: vi.fn().mockResolvedValue({ url: 'file', contentType: 'image/png' }) }
    await new UploadMaintenanceTicketAttachmentUseCase(repo, storage).execute({
      ...renter,
      ticketId: ticket.id,
      filename: 'photo.png',
      contentType: 'image/png',
      body: Buffer.from('photo'),
    })
    expect(repo.addAttachment).toHaveBeenCalledWith(
      expect.objectContaining({ id: ticket.id }),
      expect.objectContaining({ authorId: 'renter', url: 'file' }),
    )
  })
  it('denies collaboration on archived calls, including admin', () => {
    expect(permissionsFor(admin, { ...ticket, deletedAt: new Date() }).collaborate).toBe(false)
  })
})
