import { vi } from 'vitest'

import type { TeamInvitationRepository } from '../../../application/ports/team-invitation-repository.port'
import type { TeamRepository } from '../../../application/ports/team-repository.port'
import type { TeamStaffUser } from '../../../types/team-repository'

export const owner = { actorId: 'owner-1', actorTenantId: 'tenant-1', actorRole: 'OWNER' as const }

export function staff(overrides: Partial<TeamStaffUser>): TeamStaffUser {
  return {
    id: 'agent-1',
    name: 'Marina',
    role: 'AGENT',
    active: true,
    pendingInvitation: false,
    ...overrides,
  }
}

export function teamRepository(people: TeamStaffUser[] = []): TeamRepository {
  return {
    listMembers: vi.fn().mockResolvedValue([]),
    loadMetrics: vi.fn(),
    findStaffUser: vi.fn(
      async (_tenantId: string, id: string) => people.find((person) => person.id === id) ?? null,
    ),
    transfer: vi.fn().mockResolvedValue({ propertyIds: ['p1'], leadIds: [], eventIds: [] }),
    deactivateWithTransfer: vi
      .fn()
      .mockResolvedValue({ propertyIds: ['p1'], leadIds: ['l1'], eventIds: ['e1'] }),
    activate: vi.fn().mockResolvedValue(true),
    setGoal: vi.fn(),
    listGoals: vi.fn().mockResolvedValue([]),
  }
}

export function invitationRepository(
  overrides: Partial<TeamInvitationRepository> = {},
): TeamInvitationRepository {
  return {
    isEmailInUse: vi.fn().mockResolvedValue(false),
    create: vi.fn(),
    findPendingByUser: vi.fn().mockResolvedValue(null),
    replaceToken: vi.fn().mockResolvedValue(true),
    hasPortfolio: vi.fn().mockResolvedValue(false),
    deleteInvitedUser: vi.fn().mockResolvedValue(true),
    findByTokenHash: vi.fn().mockResolvedValue(null),
    accept: vi.fn().mockResolvedValue(true),
    ...overrides,
  }
}
