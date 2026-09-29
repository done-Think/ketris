import { describe, expect, it, vi } from 'vitest'

import {
  MaintenancePropertyNotFoundError,
  MaintenanceTicketAlreadyResolvedError,
  MaintenanceTicketNotFoundError,
} from '../../../domain/errors'
import type { MaintenanceTicket } from '../../../domain/maintenance-ticket.entity'
import type { MaintenanceTicketRepository } from '../../../application/ports/maintenance-ticket-repository.port'
import { AddMaintenanceTicketNoteUseCase } from '../../../application/use-cases/add-maintenance-ticket-note.use-case'
import { CreateMaintenanceTicketUseCase } from '../../../application/use-cases/create-maintenance-ticket.use-case'
import { DeleteMaintenanceTicketUseCase } from '../../../application/use-cases/delete-maintenance-ticket.use-case'
import { GetMaintenanceTicketUseCase } from '../../../application/use-cases/get-maintenance-ticket.use-case'
import { ListMaintenanceTicketActivitiesUseCase } from '../../../application/use-cases/list-maintenance-ticket-activities.use-case'
import { ListMaintenanceTicketsUseCase } from '../../../application/use-cases/list-maintenance-tickets.use-case'
import { ResolveMaintenanceTicketUseCase } from '../../../application/use-cases/resolve-maintenance-ticket.use-case'
import { UpdateMaintenanceTicketUseCase } from '../../../application/use-cases/update-maintenance-ticket.use-case'

const ticket: MaintenanceTicket = {
  id: 'ticket-1',
  tenantId: 'tenant-1',
  propertyId: 'property-1',
  propertyTitle: 'Apt Jardins 3q',
  category: 'Hidráulica',
  priority: 'URGENTE',
  status: 'ABERTO',
  title: 'Vazamento na cozinha',
  description: 'A pia está vazando.',
  openedById: 'user-1',
  openedByName: 'Bruno Oliveira',
  resolvedAt: null,
  createdAt: new Date('2026-09-29T00:00:00.000Z'),
  updatedAt: new Date('2026-09-29T00:00:00.000Z'),
  activities: [],
  attachments: [],
}

function createRepository(
  overrides?: Partial<MaintenanceTicketRepository>,
): MaintenanceTicketRepository {
  return {
    findPropertyForTenant: vi.fn().mockResolvedValue({ id: 'property-1', title: 'Apt Jardins 3q' }),
    create: vi.fn().mockResolvedValue(ticket),
    findMany: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    findById: vi.fn().mockResolvedValue(ticket),
    update: vi.fn().mockResolvedValue(ticket),
    delete: vi.fn().mockResolvedValue(undefined),
    resolve: vi.fn().mockResolvedValue({ ...ticket, status: 'RESOLVIDO', resolvedAt: new Date() }),
    addNote: vi.fn().mockResolvedValue({
      id: 'activity-1',
      ticketId: 'ticket-1',
      type: 'NOTA',
      message: 'Olá',
      authorId: 'user-1',
      authorName: 'Bruno Oliveira',
      createdAt: new Date('2026-09-29T00:00:00.000Z'),
    }),
    findActivities: vi.fn().mockResolvedValue([]),
    ...overrides,
  }
}

describe('CreateMaintenanceTicketUseCase', () => {
  it('lança MaintenancePropertyNotFoundError quando o imóvel não existe no tenant', async () => {
    const repository = createRepository({ findPropertyForTenant: vi.fn().mockResolvedValue(null) })
    const useCase = new CreateMaintenanceTicketUseCase(repository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'user-1',
        actorName: 'Bruno Oliveira',
        propertyId: 'property-1',
        category: 'Hidráulica',
        priority: 'URGENTE',
        title: 'Vazamento na cozinha',
        description: 'A pia está vazando.',
      }),
    ).rejects.toThrow(MaintenancePropertyNotFoundError)
  })

  it('cria o chamado quando o imóvel pertence ao tenant', async () => {
    const repository = createRepository()
    const useCase = new CreateMaintenanceTicketUseCase(repository)

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'user-1',
      actorName: 'Bruno Oliveira',
      propertyId: 'property-1',
      category: 'Hidráulica',
      priority: 'URGENTE',
      title: 'Vazamento na cozinha',
      description: 'A pia está vazando.',
    })

    expect(result).toEqual(ticket)
    expect(repository.create).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      propertyId: 'property-1',
      category: 'Hidráulica',
      priority: 'URGENTE',
      title: 'Vazamento na cozinha',
      description: 'A pia está vazando.',
      openedById: 'user-1',
      openedByName: 'Bruno Oliveira',
    })
  })
})

describe('ListMaintenanceTicketsUseCase', () => {
  it('delega os filtros para o repositório', async () => {
    const repository = createRepository()
    const useCase = new ListMaintenanceTicketsUseCase(repository)

    await useCase.execute({ tenantId: 'tenant-1', status: 'ABERTO' })

    expect(repository.findMany).toHaveBeenCalledWith({ tenantId: 'tenant-1', status: 'ABERTO' })
  })
})

describe('GetMaintenanceTicketUseCase', () => {
  it('lança MaintenanceTicketNotFoundError quando o chamado não existe no tenant', async () => {
    const repository = createRepository({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new GetMaintenanceTicketUseCase(repository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', ticketId: 'missing' }),
    ).rejects.toThrow(MaintenanceTicketNotFoundError)
  })

  it('retorna o chamado quando encontrado', async () => {
    const repository = createRepository()
    const useCase = new GetMaintenanceTicketUseCase(repository)

    const result = await useCase.execute({ actorTenantId: 'tenant-1', ticketId: 'ticket-1' })

    expect(result).toEqual(ticket)
  })
})

describe('UpdateMaintenanceTicketUseCase', () => {
  it('lança MaintenanceTicketNotFoundError quando o chamado não existe no tenant', async () => {
    const repository = createRepository({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new UpdateMaintenanceTicketUseCase(repository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', ticketId: 'missing', title: 'Novo título' }),
    ).rejects.toThrow(MaintenanceTicketNotFoundError)
  })

  it('lança MaintenancePropertyNotFoundError quando o novo imóvel não existe no tenant', async () => {
    const repository = createRepository({ findPropertyForTenant: vi.fn().mockResolvedValue(null) })
    const useCase = new UpdateMaintenanceTicketUseCase(repository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', ticketId: 'ticket-1', propertyId: 'unknown' }),
    ).rejects.toThrow(MaintenancePropertyNotFoundError)
  })

  it('atualiza o chamado quando os dados são válidos', async () => {
    const repository = createRepository()
    const useCase = new UpdateMaintenanceTicketUseCase(repository)

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      ticketId: 'ticket-1',
      title: 'Vazamento atualizado',
    })

    expect(result).toEqual(ticket)
    expect(repository.update).toHaveBeenCalledWith('tenant-1', 'ticket-1', {
      propertyId: undefined,
      category: undefined,
      priority: undefined,
      title: 'Vazamento atualizado',
      description: undefined,
    })
  })
})

describe('DeleteMaintenanceTicketUseCase', () => {
  it('lança MaintenanceTicketNotFoundError quando o chamado não existe no tenant', async () => {
    const repository = createRepository({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new DeleteMaintenanceTicketUseCase(repository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', ticketId: 'missing' }),
    ).rejects.toThrow(MaintenanceTicketNotFoundError)
  })

  it('exclui o chamado quando encontrado', async () => {
    const repository = createRepository()
    const useCase = new DeleteMaintenanceTicketUseCase(repository)

    await useCase.execute({ actorTenantId: 'tenant-1', ticketId: 'ticket-1' })

    expect(repository.delete).toHaveBeenCalledWith('tenant-1', 'ticket-1')
  })
})

describe('ResolveMaintenanceTicketUseCase', () => {
  it('lança MaintenanceTicketNotFoundError quando o chamado não existe no tenant', async () => {
    const repository = createRepository({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new ResolveMaintenanceTicketUseCase(repository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'user-1',
        actorName: 'Bruno Oliveira',
        ticketId: 'missing',
      }),
    ).rejects.toThrow(MaintenanceTicketNotFoundError)
  })

  it('lança MaintenanceTicketAlreadyResolvedError quando o chamado já está resolvido', async () => {
    const repository = createRepository({
      findById: vi.fn().mockResolvedValue({ ...ticket, status: 'RESOLVIDO' }),
    })
    const useCase = new ResolveMaintenanceTicketUseCase(repository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'user-1',
        actorName: 'Bruno Oliveira',
        ticketId: 'ticket-1',
      }),
    ).rejects.toThrow(MaintenanceTicketAlreadyResolvedError)
  })

  it('lança MaintenanceTicketAlreadyResolvedError quando o chamado já está fechado', async () => {
    const repository = createRepository({
      findById: vi.fn().mockResolvedValue({ ...ticket, status: 'FECHADO' }),
    })
    const useCase = new ResolveMaintenanceTicketUseCase(repository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'user-1',
        actorName: 'Bruno Oliveira',
        ticketId: 'ticket-1',
      }),
    ).rejects.toThrow(MaintenanceTicketAlreadyResolvedError)
  })

  it('resolve o chamado e registra a atividade de mudança de status', async () => {
    const repository = createRepository()
    const useCase = new ResolveMaintenanceTicketUseCase(repository)

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'user-1',
      actorName: 'Bruno Oliveira',
      ticketId: 'ticket-1',
    })

    expect(result.status).toBe('RESOLVIDO')
    expect(repository.resolve).toHaveBeenCalledWith('tenant-1', 'ticket-1', {
      type: 'MUDANCA_STATUS',
      message: 'Chamado marcado como resolvido.',
      authorId: 'user-1',
      authorName: 'Bruno Oliveira',
    })
  })
})

describe('AddMaintenanceTicketNoteUseCase', () => {
  it('lança MaintenanceTicketNotFoundError quando o chamado não existe no tenant', async () => {
    const repository = createRepository({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new AddMaintenanceTicketNoteUseCase(repository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'user-1',
        actorName: 'Bruno Oliveira',
        ticketId: 'missing',
        message: 'Olá',
      }),
    ).rejects.toThrow(MaintenanceTicketNotFoundError)
  })

  it('registra a nota na linha do tempo', async () => {
    const repository = createRepository()
    const useCase = new AddMaintenanceTicketNoteUseCase(repository)

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'user-1',
      actorName: 'Bruno Oliveira',
      ticketId: 'ticket-1',
      message: '  Olá  ',
    })

    expect(result.message).toBe('Olá')
    expect(repository.addNote).toHaveBeenCalledWith('tenant-1', 'ticket-1', {
      type: 'NOTA',
      message: 'Olá',
      authorId: 'user-1',
      authorName: 'Bruno Oliveira',
    })
  })
})

describe('ListMaintenanceTicketActivitiesUseCase', () => {
  it('lança MaintenanceTicketNotFoundError quando o chamado não existe no tenant', async () => {
    const repository = createRepository({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new ListMaintenanceTicketActivitiesUseCase(repository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', ticketId: 'missing' }),
    ).rejects.toThrow(MaintenanceTicketNotFoundError)
  })

  it('lista as atividades do chamado', async () => {
    const repository = createRepository()
    const useCase = new ListMaintenanceTicketActivitiesUseCase(repository)

    await useCase.execute({ actorTenantId: 'tenant-1', ticketId: 'ticket-1' })

    expect(repository.findActivities).toHaveBeenCalledWith('tenant-1', 'ticket-1')
  })
})
