import { describe, expect, it, vi } from 'vitest'
import { ConflictError, ForbiddenError } from '@server/shared/errors'
import {
  MaintenancePropertyNotFoundError,
  MaintenanceTicketNotFoundError,
} from '../../../domain/errors'
import { CreateMaintenanceTicketUseCase } from '../../../application/use-cases/create-maintenance-ticket.use-case'
import { GetMaintenanceTicketUseCase } from '../../../application/use-cases/get-maintenance-ticket.use-case'
import { ListMaintenanceTicketsUseCase } from '../../../application/use-cases/list-maintenance-tickets.use-case'
import { AddMaintenanceTicketNoteUseCase } from '../../../application/use-cases/add-maintenance-ticket-note.use-case'
import { UploadMaintenanceTicketAttachmentUseCase } from '../../../application/use-cases/upload-maintenance-ticket-attachment.use-case'
import { ListMaintenanceTicketActivitiesUseCase } from '../../../application/use-cases/list-maintenance-ticket-activities.use-case'
import { deleteTicket, updateTicket } from '../../../application/workflow'
import { canAccessTicket, publicTicket } from '../../../application/authorization'
import {
  actor,
  admin,
  agent,
  owner,
  renter,
  contract,
  ticket,
  repository,
} from '../../fixtures/maintenance-ticket'

describe('Maintenance access', () => {
  it('uses the agency tenant for shared-tenant renter creation, history and uploads', async () => {
    const sharedRenter = { ...renter, actorTenantId: 'shared-renters' }
    const repo = repository()
    expect(canAccessTicket(sharedRenter, ticket)).toBe(true)
    await new CreateMaintenanceTicketUseCase(repo).execute({
      ...sharedRenter,
      contractId: contract.id,
      title: 'Leak',
      description: 'Details',
      category: 'Plumbing',
      priority: 'NORMAL',
    })
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: contract.tenantId }),
    )
    await new ListMaintenanceTicketActivitiesUseCase(repo).execute({
      ...sharedRenter,
      ticketId: ticket.id,
    })
    expect(repo.findActivities).toHaveBeenCalledWith(ticket.tenantId, ticket.id)
    const storage = {
      upload: vi.fn().mockResolvedValue({ url: 'private.png', contentType: 'image/png' }),
    }
    await new UploadMaintenanceTicketAttachmentUseCase(repo, storage).execute({
      ...sharedRenter,
      ticketId: ticket.id,
      filename: 'photo.png',
      contentType: 'image/png',
      body: Buffer.from([1, 2, 3]),
    })
    expect(storage.upload).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: ticket.tenantId }),
    )
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
