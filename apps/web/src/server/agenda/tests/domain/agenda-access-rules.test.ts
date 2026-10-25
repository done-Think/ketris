import { describe, expect, it } from 'vitest'

import type { AgendaEvent } from '../../domain/agenda-event.entity'
import {
  assertCanManageAgendaEvent,
  canLinkUserToAgendaEvent,
  resolveAgendaReadScope,
} from '../../domain/agenda-access-rules'

const event = (overrides: Partial<AgendaEvent> = {}) =>
  ({
    responsavelId: 'agent-1',
    criadoPorId: 'agent-1',
    destino: 'SHARED_TEAM',
    interno: false,
    ...overrides,
  }) as AgendaEvent

describe('assertCanManageAgendaEvent', () => {
  it('o OWNER gerencia qualquer evento da imobiliária', () => {
    expect(() =>
      assertCanManageAgendaEvent('OWNER', 'owner-1', event({ interno: true })),
    ).not.toThrow()
  })

  it.each(['RENTER', 'PROPERTY_OWNER'] as const)(
    '%s gerencia só os eventos que criou ou dos quais é responsável',
    (papel) => {
      expect(() =>
        assertCanManageAgendaEvent(papel, 'user-1', event({ criadoPorId: 'user-1' })),
      ).not.toThrow()
      expect(() =>
        assertCanManageAgendaEvent(papel, 'user-1', event({ responsavelId: 'user-1' })),
      ).not.toThrow()
      expect(() => assertCanManageAgendaEvent(papel, 'user-1', event())).toThrow(
        expect.objectContaining({ status: 403, code: 'FORBIDDEN' }),
      )
    },
  )
})

describe('resolveAgendaReadScope', () => {
  it('usa o tenant inteiro para o dono da imobiliária (OWNER)', () => {
    expect(
      resolveAgendaReadScope({
        actorTenantId: 'tenant-1',
        actorUserId: 'user-1',
        actorPapel: 'OWNER',
      }),
    ).toEqual({ kind: 'tenant', tenantId: 'tenant-1' })
  })

  it.each(['AGENT', 'PROPERTY_OWNER'] as const)(
    'usa o tenant e o usuário para %s',
    (actorPapel) => {
      expect(
        resolveAgendaReadScope({ actorTenantId: 'tenant-1', actorUserId: 'user-1', actorPapel }),
      ).toEqual({
        kind: actorPapel === 'AGENT' ? 'agent' : 'owner',
        tenantId: 'tenant-1',
        userId: 'user-1',
      })
    },
  )

  it('usa o vínculo com o próprio usuário (e não o tenant) para RENTER', () => {
    expect(
      resolveAgendaReadScope({
        actorTenantId: 'renters-tenant',
        actorUserId: 'renter-1',
        actorPapel: 'RENTER',
      }),
    ).toEqual({ kind: 'linkedUser', userId: 'renter-1' })
  })
})

describe('canLinkUserToAgendaEvent', () => {
  const approvedAt = new Date('2026-01-01T00:00:00.000Z')

  it('aceita RENTER ativo do tenant compartilhado de locatários', () => {
    expect(
      canLinkUserToAgendaEvent(
        { tenantId: 'renters-tenant', papel: 'RENTER', ativo: true, vinculoAprovadoEm: approvedAt },
        'tenant-1',
      ),
    ).toBe(true)
  })

  it('recusa RENTER inativo', () => {
    expect(
      canLinkUserToAgendaEvent(
        {
          tenantId: 'renters-tenant',
          papel: 'RENTER',
          ativo: false,
          vinculoAprovadoEm: approvedAt,
        },
        'tenant-1',
      ),
    ).toBe(false)
  })

  it.each(['OWNER', 'AGENT'] as const)(
    'aceita %s ativo e aprovado do tenant do evento',
    (papel) => {
      expect(
        canLinkUserToAgendaEvent(
          { tenantId: 'tenant-1', papel, ativo: true, vinculoAprovadoEm: approvedAt },
          'tenant-1',
        ),
      ).toBe(true)
    },
  )

  it('recusa membro da equipe de outro tenant', () => {
    expect(
      canLinkUserToAgendaEvent(
        { tenantId: 'tenant-2', papel: 'AGENT', ativo: true, vinculoAprovadoEm: approvedAt },
        'tenant-1',
      ),
    ).toBe(false)
  })

  it('recusa membro da equipe inativo ou com vínculo pendente de aprovação', () => {
    expect(
      canLinkUserToAgendaEvent(
        { tenantId: 'tenant-1', papel: 'AGENT', ativo: false, vinculoAprovadoEm: approvedAt },
        'tenant-1',
      ),
    ).toBe(false)
    expect(
      canLinkUserToAgendaEvent(
        { tenantId: 'tenant-1', papel: 'AGENT', ativo: true, vinculoAprovadoEm: null },
        'tenant-1',
      ),
    ).toBe(false)
  })
})
