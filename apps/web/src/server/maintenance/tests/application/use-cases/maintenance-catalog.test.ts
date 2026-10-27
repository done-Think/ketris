// @vitest-environment node
import { ForbiddenError } from '@server/shared/errors'
import { describe, expect, it, vi } from 'vitest'
import { CreateMaintenanceProviderUseCase } from '../../../application/use-cases/create-maintenance-provider.use-case'
import { GetMaintenanceTicketUseCase } from '../../../application/use-cases/get-maintenance-ticket.use-case'
import { ListMaintenanceProvidersUseCase } from '../../../application/use-cases/list-maintenance-providers.use-case'
import { UpdateMaintenanceProviderUseCase } from '../../../application/use-cases/update-maintenance-provider.use-case'
import { MaintenanceTicketNotFoundError } from '../../../domain/errors'
import { admin, agent, renter, repository } from '../../fixtures/maintenance-ticket'

function catalog() {
  return {
    list: vi.fn().mockResolvedValue({ items: [], totalCount: 0, page: 1, pageSize: 5 }),
    create: vi.fn(),
    update: vi.fn(),
  }
}

describe('Maintenance catalog permissions and safe output', () => {
  it('lets management list its own catalog without a ticket', async () => {
    const store = catalog()
    await new ListMaintenanceProvidersUseCase(store, repository()).execute({
      ...admin,
      search: 'Jose',
    })
    expect(store.list).toHaveBeenCalledWith(
      admin.actorTenantId,
      expect.objectContaining({ search: 'Jose' }),
    )
  })
  it('registers a shared-tenant renter provider in the ticket agency and normalizes empty contact fields', async () => {
    const store = catalog()
    const account = { ...renter, actorTenantId: 'shared-renters' }
    await new CreateMaintenanceProviderUseCase(store, repository()).execute({
      ...account,
      ticketId: 'ticket-1',
      provider: { name: '  Jose  ', phone: ' ' },
    })
    expect(store.create).toHaveBeenCalledWith(expect.objectContaining(account), 'tenant-1', {
      name: 'Jose',
      phone: null,
      email: null,
      notes: null,
    })
  })
  it('blocks unassigned agents, unrelated renters and access without a ticket', async () => {
    for (const input of [
      { ...agent, ticketId: 'ticket-1' },
      { ...renter, actorId: 'unrelated', ticketId: 'ticket-1' },
      renter,
    ]) {
      const store = catalog()
      await expect(
        new ListMaintenanceProvidersUseCase(store, repository()).execute(input),
      ).rejects.toBeDefined()
      expect(store.list).not.toHaveBeenCalled()
    }
  })
  it('does not list inactive providers or update the catalog for contributors', async () => {
    const store = catalog()
    await expect(
      new ListMaintenanceProvidersUseCase(store, repository()).execute({
        ...renter,
        ticketId: 'ticket-1',
        includeInactive: true,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    await expect(async () =>
      new UpdateMaintenanceProviderUseCase(store).execute({
        ...renter,
        providerId: 'p1',
        changes: { active: true },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect(store.list).not.toHaveBeenCalled()
    expect(store.update).not.toHaveBeenCalled()
  })
  it('uses the same pending-replacement rule for inline assignment and catalog registration', async () => {
    const store = catalog()
    const tickets = repository({
      replacementRequests: [
        {
          id: 'request',
          reason: 'Replace',
          requestedById: 'owner',
          requestedByName: 'Owner',
          status: 'PENDENTE',
          decisionReason: null,
          decidedByName: null,
          decidedAt: null,
          createdAt: new Date(),
        },
      ],
    })
    await expect(
      new CreateMaintenanceProviderUseCase(store, tickets).execute({
        ...renter,
        ticketId: 'ticket-1',
        provider: { name: 'Blocked' },
      }),
    ).rejects.toBeDefined()
    expect(store.create).not.toHaveBeenCalled()
  })
  it('never returns internal access metadata from the ticket use case', async () => {
    const result = await new GetMaintenanceTicketUseCase(repository()).execute({
      ...renter,
      ticketId: 'ticket-1',
    })
    expect(result).not.toHaveProperty('access')
    expect(result.permissions).toMatchObject({ provider: true, edit: false })
    await expect(
      new GetMaintenanceTicketUseCase(repository()).execute({
        ...renter,
        actorId: 'unrelated',
        ticketId: 'ticket-1',
      }),
    ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
  })
})
