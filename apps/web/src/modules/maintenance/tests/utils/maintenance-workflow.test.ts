import { describe, expect, it } from 'vitest'

import { createMaintenanceLinksSchema } from '../../schemas/maintenance-links-schema'
import { createMaintenanceWorkflowSchema } from '../../schemas/maintenance-workflow-schema'
import type { MaintenanceProviderOption } from '../../types/maintenance-provider'
import type { MaintenanceWorkflowFormValues } from '../../types/maintenance-workflow'
import { buildMaintenanceWorkflowAction } from '../../utils/maintenance-workflow'

const translate = (key: string) => key

const catalogProvider: MaintenanceProviderOption = {
  id: 'p1',
  name: 'Hidráulica',
  active: true,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
}

const emptyValues: MaintenanceWorkflowFormValues = {
  reason: '',
  catalogProvider: null,
  responsibleId: '',
  contractId: '',
  status: 'OPEN',
  name: '',
  phone: '',
  email: '',
  notes: '',
}

function issuesFor(
  action: Parameters<typeof createMaintenanceWorkflowSchema>[0],
  values: Partial<MaintenanceWorkflowFormValues>,
  role?: string,
) {
  const result = createMaintenanceWorkflowSchema(action, role, translate).safeParse({
    ...emptyValues,
    ...values,
  })

  return result.success
    ? []
    : result.error.issues.map((issue) => `${issue.path[0]}:${issue.message}`)
}

describe('buildMaintenanceWorkflowAction', () => {
  it('uses the catalog provider id when one is chosen', () => {
    const values = { ...emptyValues, catalogProvider }

    expect(
      buildMaintenanceWorkflowAction(values, {
        action: 'provider',
      }),
    ).toEqual({ action: 'provider', provider: { id: 'p1' } })
  })

  it('builds a free provider with nulls for empty contacts', () => {
    expect(
      buildMaintenanceWorkflowAction(
        { ...emptyValues, name: 'Silva', phone: '1199' },
        { action: 'provider' },
      ),
    ).toEqual({
      action: 'provider',
      provider: { name: 'Silva', phone: '1199', email: null, notes: null },
    })
  })

  it('carries the request id on replacement decisions', () => {
    expect(
      buildMaintenanceWorkflowAction(
        { ...emptyValues, reason: 'Sem retorno' },
        { action: 'rejectReplacement', requestId: 'r1' },
      ),
    ).toEqual({ action: 'rejectReplacement', requestId: 'r1', reason: 'Sem retorno' })
  })

  it('makes the renter reopen as ABERTO with a reason, and staff pick the status', () => {
    expect(
      buildMaintenanceWorkflowAction(
        { ...emptyValues, reason: 'Voltou a vazar' },
        { action: 'reopen' },
        'RENTER',
      ),
    ).toEqual({ action: 'reopen', status: 'OPEN', reason: 'Voltou a vazar' })
    expect(
      buildMaintenanceWorkflowAction(
        { ...emptyValues, status: 'IN_PROGRESS' },
        { action: 'reopen' },
        'OWNER',
      ),
    ).toEqual({ action: 'reopen', status: 'IN_PROGRESS' })
  })

  it('maps assignment and contract linking', () => {
    expect(
      buildMaintenanceWorkflowAction({ ...emptyValues, responsibleId: 'a1' }, { action: 'assign' }),
    ).toEqual({ action: 'assign', responsibleId: 'a1' })
    expect(
      buildMaintenanceWorkflowAction(
        { ...emptyValues, contractId: 'c1' },
        { action: 'linkContract' },
      ),
    ).toEqual({ action: 'linkContract', contractId: 'c1' })
  })
})

describe('createMaintenanceWorkflowSchema', () => {
  it('requires a reason only for the actions that need one', () => {
    expect(issuesFor('contest', {})).toEqual(['reason:required'])
    expect(issuesFor('requestReplacement', {})).toEqual(['reason:required'])
    expect(issuesFor('reopen', {}, 'RENTER')).toEqual(['reason:required'])
    expect(issuesFor('reopen', {}, 'OWNER')).toEqual([])
    expect(issuesFor('approveReplacement', { catalogProvider })).toEqual([])
  })

  it('requires the provider name and a valid email for a free provider', () => {
    expect(issuesFor('provider', {})).toEqual(['name:required'])
    expect(issuesFor('provider', { name: 'Silva', email: 'invalido' })).toEqual([
      'email:emailInvalid',
    ])
    expect(issuesFor('provider', { name: 'Silva', email: 'a@b.com' })).toEqual([])
  })

  it('limits the size of the provider fields and the reason', () => {
    expect(issuesFor('provider', { name: 'x'.repeat(201) })).toEqual(['name:nameTooLong'])
    expect(issuesFor('contest', { reason: 'x'.repeat(5001) })).toEqual(['reason:reasonTooLong'])
  })

  it('requires the responsible and the contract on their actions', () => {
    expect(issuesFor('assign', {})).toEqual(['responsibleId:required'])
    expect(issuesFor('linkContract', {})).toEqual(['contractId:required'])
  })
})

describe('createMaintenanceLinksSchema', () => {
  const parse = (values: Record<string, string>) =>
    createMaintenanceLinksSchema(translate).safeParse({
      contractId: '',
      ownerId: '',
      partyId: '',
      renterId: '',
      ...values,
    })

  it('needs a contract and at least one link', () => {
    expect(parse({}).success).toBe(false)
    expect(parse({ contractId: 'c1' }).success).toBe(false)
    expect(parse({ contractId: 'c1', ownerId: 'o1' }).success).toBe(true)
  })

  it('needs the renter user whenever a renter party is chosen', () => {
    expect(parse({ contractId: 'c1', partyId: 'p1' }).success).toBe(false)
    expect(parse({ contractId: 'c1', partyId: 'p1', renterId: 'u1' }).success).toBe(true)
  })
})
