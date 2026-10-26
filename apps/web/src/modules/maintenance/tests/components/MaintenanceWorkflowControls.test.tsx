import { render, screen } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MaintenanceWorkflowControls } from '../../components/MaintenanceWorkflowControls'
import { useMaintenanceAction, useMaintenanceOptions } from '../../hooks/use-maintenance'
import type { ApiMaintenanceTicket, MaintenancePermissions } from '../../types/service'

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }))

vi.mock('../../hooks/use-maintenance', () => ({
  useMaintenanceAction: vi.fn(),
  useMaintenanceOptions: vi.fn(),
}))

const ticket: ApiMaintenanceTicket = {
  id: 'MNT-0089',
  propertyId: 'p1',
  propertyTitle: 'Apt Jardins 3q',
  permissions: { collaborate: true } as MaintenancePermissions,
  replacementRequests: [
    {
      id: 'r1',
      reason: 'Prestador não apareceu',
      status: 'PENDENTE',
      requestedByName: 'Bruno Oliveira',
      decisionReason: null,
      decidedByName: null,
      createdAt: '2025-02-20T00:00:00.000Z',
    },
  ],
  category: 'PLUMBING',
  priority: 'URGENTE',
  status: 'EM_ANDAMENTO',
  title: 'Vazamento na cozinha',
  description: 'Vazamento embaixo da pia da cozinha.',
  openedById: 'user-1',
  openedByName: 'Bruno Oliveira',
  resolvedAt: null,
  createdAt: '2025-02-20T00:00:00.000Z',
  updatedAt: '2025-02-20T00:00:00.000Z',
  activities: [],
  attachments: [],
}

function mockSession(role: 'OWNER' | 'AGENT') {
  vi.mocked(useSession).mockReturnValue({
    data: { tenantId: 'tenant-1', user: { id: 'user-1' }, role },
    status: 'authenticated',
    update: vi.fn(),
  } as unknown as ReturnType<typeof useSession>)
}

describe('MaintenanceWorkflowControls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useMaintenanceOptions).mockReturnValue({
      data: { contracts: [], users: [] },
    } as unknown as ReturnType<typeof useMaintenanceOptions>)
    vi.mocked(useMaintenanceAction).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useMaintenanceAction>)
  })

  it('lets an OWNER session role decide a pending replacement request', () => {
    mockSession('OWNER')
    render(<MaintenanceWorkflowControls ticket={ticket} />)

    expect(screen.getByRole('button', { name: 'Aprovar troca' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Rejeitar troca' })).toBeVisible()
  })

  it('hides the replacement decision from other session roles', () => {
    mockSession('AGENT')
    render(<MaintenanceWorkflowControls ticket={ticket} />)

    expect(screen.getByText('Bruno Oliveira: Prestador não apareceu')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Aprovar troca' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rejeitar troca' })).not.toBeInTheDocument()
  })
})
