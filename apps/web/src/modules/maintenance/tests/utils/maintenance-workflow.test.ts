import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'

import { createMaintenanceLinksSchema } from '../../schemas/maintenance-links-schema'
import { createMaintenanceWorkflowSchema } from '../../schemas/maintenance-workflow-schema'
import type { ApiMaintenanceTicket } from '../../types/service'
import { errorMessage } from '../../utils/error-message'
import {
  buildCreateMaintenanceTicketPayload,
  buildUpdateMaintenanceTicketPayload,
  mapMaintenanceTicketToFormValues,
} from '../../utils/maintenance-adapter'
import {
  buildMaintenanceWorkflowAction,
  maintenanceWorkflowDefaultValues,
  maintenanceWorkflowRequirements,
} from '../../utils/maintenance-workflow'

const translate = (key: string) => key
const provider = { name: 'Hidráulica Silva', phone: '1199', email: null, notes: null }
const ticket = { responsibleId: 'agent', provider } as unknown as ApiMaintenanceTicket
const values = maintenanceWorkflowDefaultValues(ticket, 'provider')

describe('maintenance workflow helpers', () => {
  it('asks for a reason only where the API requires one', () => {
    expect(maintenanceWorkflowRequirements('contest', false).reason).toBe(true)
    expect(maintenanceWorkflowRequirements('reopen', true).reason).toBe(true)
    expect(maintenanceWorkflowRequirements('reopen', false).reason).toBe(false)
    expect(maintenanceWorkflowRequirements('approveReplacement', false)).toEqual({
      reason: false,
      responsible: false,
      contract: false,
      provider: true,
    })
  })

  it('starts from the current provider except when approving a replacement', () => {
    expect(values).toMatchObject({ responsibleId: 'agent', providerName: 'Hidráulica Silva' })
    expect(maintenanceWorkflowDefaultValues(ticket, 'approveReplacement').providerName).toBe('')
  })

  it('builds each action payload from the form values', () => {
    expect(buildMaintenanceWorkflowAction({ action: 'provider' }, values, false)).toEqual({
      action: 'provider',
      provider: { name: 'Hidráulica Silva', phone: '1199', email: null, notes: null },
    })
    expect(
      buildMaintenanceWorkflowAction(
        { action: 'rejectReplacement', requestId: 'r1' },
        { ...values, reason: 'Sem motivo' },
        false,
      ),
    ).toEqual({ action: 'rejectReplacement', requestId: 'r1', reason: 'Sem motivo' })
    expect(
      buildMaintenanceWorkflowAction({ action: 'reopen' }, { ...values, reason: 'Voltou' }, true),
    ).toEqual({ action: 'reopen', status: 'ABERTO', reason: 'Voltou' })
    expect(
      buildMaintenanceWorkflowAction(
        { action: 'reopen' },
        { ...values, status: 'EM_ANDAMENTO' },
        false,
      ),
    ).toEqual({ action: 'reopen', status: 'EM_ANDAMENTO' })
    expect(buildMaintenanceWorkflowAction({ action: 'start' }, values, false)).toEqual({
      action: 'start',
    })
  })
})

describe('maintenance form schemas', () => {
  it('requires only the fields of the chosen action and validates the provider email', () => {
    const reasonSchema = createMaintenanceWorkflowSchema(translate, {
      ...maintenanceWorkflowRequirements('contest', false),
    })
    expect(reasonSchema.safeParse({ ...values, reason: '  ' }).success).toBe(false)
    expect(reasonSchema.safeParse({ ...values, reason: 'Ainda vaza' }).success).toBe(true)

    const providerSchema = createMaintenanceWorkflowSchema(
      translate,
      maintenanceWorkflowRequirements('provider', false),
    )
    expect(providerSchema.safeParse({ ...values, providerEmail: 'x' }).success).toBe(false)
    expect(providerSchema.safeParse({ ...values, providerName: '' }).success).toBe(false)
  })

  it('needs a contract and something to link, and a renter when a party is chosen', () => {
    const schema = createMaintenanceLinksSchema(translate)
    const empty = { contractId: '', ownerId: '', partyId: '', renterId: '' }
    expect(schema.safeParse({ ...empty, ownerId: 'o1' }).success).toBe(false)
    expect(schema.safeParse({ ...empty, contractId: 'c1' }).success).toBe(false)
    expect(schema.safeParse({ ...empty, contractId: 'c1', partyId: 'p1' }).success).toBe(false)
    expect(
      schema.safeParse({ ...empty, contractId: 'c1', partyId: 'p1', renterId: 'r1' }).success,
    ).toBe(true)
  })
})

describe('maintenance ticket form adapter', () => {
  const form = {
    contractId: 'c1',
    category: 'PAINTING',
    priority: 'urgent' as const,
    title: 'Parede',
    description: 'Mofo',
  }

  it('never sends the property: the API takes it from the contract', () => {
    expect(buildCreateMaintenanceTicketPayload(form)).toEqual({
      contractId: 'c1',
      category: 'PAINTING',
      priority: 'URGENTE',
      title: 'Parede',
      description: 'Mofo',
    })
    expect(buildUpdateMaintenanceTicketPayload({ ...form, contractId: '' })).not.toHaveProperty(
      'propertyId',
    )
    expect(
      mapMaintenanceTicketToFormValues({
        contractId: null,
        category: 'OTHER',
        priority: 'NORMAL',
        title: 'T',
        description: 'D',
      } as ApiMaintenanceTicket),
    ).toEqual({
      contractId: '',
      category: 'OTHER',
      priority: 'normal',
      title: 'T',
      description: 'D',
    })
  })

  it('shows the API message when there is one', () => {
    const apiError = new AxiosError('Conflict', '409', undefined, undefined, {
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: { error: { message: 'Estado inválido' } },
    })
    expect(errorMessage(apiError, 'fallback')).toBe('Estado inválido')
    expect(errorMessage(new Error('x'), 'fallback')).toBe('fallback')
  })
})
