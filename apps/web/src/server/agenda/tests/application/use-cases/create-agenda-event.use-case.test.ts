import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { User } from '@server/auth/domain/user.entity'
import type { UserRepository } from '@server/auth/application/ports/user-repository.port'
import { AgendaPropertyNotFoundError } from '../../../domain/errors'
import type { Property } from '@server/properties/types/property'
import type { AgendaPropertyLookup } from '../../../application/ports/agenda-property-lookup.port'

import {
  AgendaEventConflictError,
  AgendaMinimumAdvanceNoticeError,
  AgendaRenterPropertyRequiredError,
  AgendaResponsibleNotFoundError,
} from '../../../domain/errors'
import type { AgendaEvent } from '../../../domain/agenda-event.entity'
import type { AgendaEventRepository } from '../../../application/ports/agenda-event-repository.port'
import { CreateAgendaEventUseCase } from '../../../application/use-cases/create-agenda-event.use-case'

const actor: User = {
  id: 'agent-1',
  tenantId: 'tenant-1',
  name: 'Corretor',
  email: 'corretor@ketris.dev',
  passwordHash: 'hash',
  role: 'AGENT',
  active: true,
  membershipApprovedAt: new Date(),
}

const PINNED_NOW = new Date('2030-01-15T12:00:00.000Z')
const VALID_INICIO = new Date('2030-01-15T16:00:00.000Z')
const VALID_FIM = new Date('2030-01-15T17:00:00.000Z')

const createdEvent: AgendaEvent = {
  id: 'event-1',
  tenantId: 'tenant-1',
  responsibleId: 'agent-1',
  createdById: 'agent-1',
  responsibleName: 'Corretor',
  ownerUserId: null,
  dono: null,
  participants: [],
  propertyId: null,
  freeFormPropertyReference: null,
  title: 'Visita ao imóvel',
  type: 'VISIT',
  status: 'CONFIRMED',
  start: VALID_INICIO,
  end: VALID_FIM,
  participantName: 'Ana',
  participantPhone: '(11) 99999-0000',
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

function createDeps(overrides?: {
  findById?: UserRepository['findById']
  findAccessibleProperty?: AgendaPropertyLookup['findAccessibleProperty']
  hasOverlap?: AgendaEventRepository['hasOverlap']
}) {
  const agendaEventRepository: AgendaEventRepository = {
    create: vi.fn().mockResolvedValue(createdEvent),
    list: vi.fn(),
    findByScopeAndId: vi.fn(),
    findByTenantAndId: vi.fn(),
    update: vi.fn(),
    reschedule: vi.fn(),
    cancel: vi.fn(),
    hasOverlap: overrides?.hasOverlap ?? vi.fn().mockResolvedValue(false),
  }
  const userRepository: UserRepository = {
    findManyByEmail: vi.fn(),

    findById: overrides?.findById ?? vi.fn().mockResolvedValue(actor),
    findByEmail: vi.fn(),
    findManyByTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
    approveMembership: vi.fn(),
  }
  const propertyRepository: AgendaPropertyLookup = {
    findAccessibleProperty:
      overrides?.findAccessibleProperty ??
      vi.fn().mockResolvedValue({ id: 'property-1' } as Property),
    findRentedProperty: vi.fn(),
  }

  return { agendaEventRepository, userRepository, propertyRepository }
}

describe('CreateAgendaEventUseCase', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(PINNED_NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('cria o evento atribuído ao próprio ator quando responsibleId não é informado', async () => {
    const deps = createDeps()
    const useCase = new CreateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.userRepository,
      deps.propertyRepository,
    )

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorUserId: 'agent-1',
      actorRole: 'AGENT',
      title: 'Visita ao imóvel',
      type: 'VISIT',
      start: VALID_INICIO,
      durationMinutes: 60,
      participantName: 'Ana',
      participantPhone: '(11) 99999-0000',
    })

    expect(deps.agendaEventRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        responsibleId: 'agent-1',
        createdById: 'agent-1',
        start: VALID_INICIO,
        end: VALID_FIM,
      }),
      { ownerEmail: undefined, participantEmails: undefined },
    )
    expect(deps.userRepository.findById).not.toHaveBeenCalled()
  })

  it('o RENTER precisa escolher o imóvel do contrato dele', async () => {
    const deps = createDeps()
    const useCase = new CreateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.userRepository,
      deps.propertyRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'renters',
        actorUserId: 'renter-1',
        actorRole: 'RENTER',
        title: 'Visita',
        start: VALID_INICIO,
        durationMinutes: 30,
        participantName: 'Ana',
        participantPhone: '11999990000',
      }),
    ).rejects.toThrow(AgendaRenterPropertyRequiredError)
    expect(deps.agendaEventRepository.create).not.toHaveBeenCalled()
  })

  it('o RENTER cria o evento na agenda da imobiliária do contrato', async () => {
    const deps = createDeps()
    vi.mocked(deps.propertyRepository.findRentedProperty).mockResolvedValue({
      propertyId: 'property-1',
      tenantId: 'agency-1',
    })
    const useCase = new CreateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.userRepository,
      deps.propertyRepository,
    )

    await useCase.execute({
      actorTenantId: 'renters',
      actorUserId: 'renter-1',
      actorRole: 'RENTER',
      propertyId: 'property-1',
      title: 'Vistoria',
      start: VALID_INICIO,
      durationMinutes: 30,
      participantName: 'Ana',
      participantPhone: '11999990000',
    })

    expect(deps.propertyRepository.findRentedProperty).toHaveBeenCalledWith(
      'renter-1',
      'property-1',
    )
    expect(deps.agendaEventRepository.hasOverlap).toHaveBeenCalledWith(
      'agency-1',
      'renter-1',
      expect.any(Date),
      expect.any(Date),
    )
    expect(deps.agendaEventRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'agency-1', responsibleId: 'renter-1' }),
      expect.anything(),
    )
  })

  it('o RENTER não agenda em imóvel que não aluga', async () => {
    const deps = createDeps()
    vi.mocked(deps.propertyRepository.findRentedProperty).mockResolvedValue(null)
    const useCase = new CreateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.userRepository,
      deps.propertyRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'renters',
        actorUserId: 'renter-1',
        actorRole: 'RENTER',
        propertyId: 'property-2',
        title: 'Vistoria',
        start: VALID_INICIO,
        durationMinutes: 30,
        participantName: 'Ana',
        participantPhone: '11999990000',
      }),
    ).rejects.toThrow(AgendaPropertyNotFoundError)
  })

  it('lança AgendaResponsibleNotFoundError quando responsibleId não pertence ao tenant', async () => {
    const deps = createDeps({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new CreateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.userRepository,
      deps.propertyRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorUserId: 'agent-1',
        actorRole: 'OWNER',
        responsibleId: 'outro-agente',
        title: 'Visita',
        start: VALID_INICIO,
        durationMinutes: 30,
        participantName: 'Ana',
        participantPhone: '11999990000',
      }),
    ).rejects.toThrow(AgendaResponsibleNotFoundError)
    expect(deps.agendaEventRepository.create).not.toHaveBeenCalled()
  })

  it('lança AgendaPropertyNotFoundError quando propertyId não existe no tenant', async () => {
    const deps = createDeps({ findAccessibleProperty: vi.fn().mockResolvedValue(null) })
    const useCase = new CreateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.userRepository,
      deps.propertyRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorUserId: 'agent-1',
        actorRole: 'AGENT',
        propertyId: 'inexistente',
        title: 'Visita',
        start: VALID_INICIO,
        durationMinutes: 30,
        participantName: 'Ana',
        participantPhone: '11999990000',
      }),
    ).rejects.toThrow(AgendaPropertyNotFoundError)
    expect(deps.agendaEventRepository.create).not.toHaveBeenCalled()
  })

  it('lança AgendaMinimumAdvanceNoticeError quando o horário é menos de 3 horas no futuro', async () => {
    const deps = createDeps()
    const useCase = new CreateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.userRepository,
      deps.propertyRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorUserId: 'agent-1',
        actorRole: 'AGENT',
        title: 'Visita',
        start: new Date(Date.now() + 60 * 60_000),
        durationMinutes: 30,
        participantName: 'Ana',
        participantPhone: '11999990000',
      }),
    ).rejects.toThrow(AgendaMinimumAdvanceNoticeError)
    expect(deps.agendaEventRepository.create).not.toHaveBeenCalled()
  })

  it('lança AgendaEventConflictError quando o responsável já tem evento nesse horário', async () => {
    const deps = createDeps({ hasOverlap: vi.fn().mockResolvedValue(true) })
    const useCase = new CreateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.userRepository,
      deps.propertyRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorUserId: 'agent-1',
        actorRole: 'AGENT',
        title: 'Visita',
        start: VALID_INICIO,
        durationMinutes: 30,
        participantName: 'Ana',
        participantPhone: '11999990000',
      }),
    ).rejects.toThrow(AgendaEventConflictError)
    expect(deps.agendaEventRepository.create).not.toHaveBeenCalled()
  })

  it('repassa dono e participantes normalizados e sem duplicatas para gravação atômica', async () => {
    const deps = createDeps()
    const useCase = new CreateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.userRepository,
      deps.propertyRepository,
    )

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorUserId: 'agent-1',
      actorRole: 'AGENT',
      title: 'Vistoria de entrada',
      start: VALID_INICIO,
      durationMinutes: 60,
      participantName: 'Ana',
      participantPhone: '(11) 99999-0000',
      ownerEmail: ' Locatario@Ketris.dev ',
      participantEmails: ['Fiador@ketris.dev', 'fiador@ketris.dev'],
    })

    expect(deps.agendaEventRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-1' }),
      { ownerEmail: 'locatario@ketris.dev', participantEmails: ['fiador@ketris.dev'] },
    )
  })
})
