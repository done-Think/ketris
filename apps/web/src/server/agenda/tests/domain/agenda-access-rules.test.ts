import { describe, expect, it } from 'vitest'

import {
  assertCanManageAgenda,
  canLinkUserToAgendaEvent,
  resolveAgendaReadScope,
} from '../../domain/agenda-access-rules'
import { AgendaRenterForbiddenError } from '../../domain/errors'

describe('assertCanManageAgenda', () => {
  it.each(['ADMIN', 'OWNER', 'AGENT'] as const)('permite gerenciar para %s', (papel) => {
    expect(() => assertCanManageAgenda(papel)).not.toThrow()
  })

  it('bloqueia RENTER com 403', () => {
    expect(() => assertCanManageAgenda('RENTER')).toThrow(AgendaRenterForbiddenError)
    expect(() => assertCanManageAgenda('RENTER')).toThrow(
      expect.objectContaining({ status: 403, code: 'FORBIDDEN' }),
    )
  })
})

describe('resolveAgendaReadScope', () => {
  it.each(['ADMIN', 'OWNER', 'AGENT'] as const)('usa o tenant do ator para %s', (actorPapel) => {
    expect(
      resolveAgendaReadScope({ actorTenantId: 'tenant-1', actorUserId: 'user-1', actorPapel }),
    ).toEqual({ kind: 'tenant', tenantId: 'tenant-1' })
  })

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

  it.each(['ADMIN', 'OWNER', 'AGENT'] as const)(
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
