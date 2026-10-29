import { describe, expect, it } from 'vitest'

import {
  allowedNextStatuses,
  canRespond,
  canTransition,
  statusForResponse,
} from '../../domain/opportunity-status'

describe('canTransition', () => {
  it('permite transições do funil normal', () => {
    expect(canTransition('DRAFT', 'SENT')).toBe(true)
    expect(canTransition('SENT', 'IN_NEGOTIATION')).toBe(true)
    expect(canTransition('IN_NEGOTIATION', 'ACCEPTED')).toBe(true)
    expect(canTransition('SENT', 'REJECTED')).toBe(true)
  })

  it('permite reabrir uma oportunidade recusada para negociação', () => {
    expect(canTransition('REJECTED', 'IN_NEGOTIATION')).toBe(true)
  })

  it('permite manter o mesmo status (no-op)', () => {
    expect(canTransition('SENT', 'SENT')).toBe(true)
    expect(canTransition('ACCEPTED', 'ACCEPTED')).toBe(true)
  })

  it('nunca permite sair de ACEITA — é terminal, pré-requisito do Contrato (FR-014)', () => {
    expect(canTransition('ACCEPTED', 'SENT')).toBe(false)
    expect(canTransition('ACCEPTED', 'IN_NEGOTIATION')).toBe(false)
    expect(canTransition('ACCEPTED', 'REJECTED')).toBe(false)
    expect(canTransition('ACCEPTED', 'DRAFT')).toBe(false)
  })

  it('não permite pular direto de RASCUNHO para ACEITA', () => {
    expect(canTransition('DRAFT', 'ACCEPTED')).toBe(false)
  })

  it('não permite voltar de um status avançado para RASCUNHO', () => {
    expect(canTransition('SENT', 'DRAFT')).toBe(false)
    expect(canTransition('IN_NEGOTIATION', 'DRAFT')).toBe(false)
    expect(canTransition('REJECTED', 'DRAFT')).toBe(false)
  })
})

describe('allowedNextStatuses', () => {
  it('reflete exatamente as regras de canTransition', () => {
    expect(allowedNextStatuses('ACCEPTED')).toEqual([])
    expect(allowedNextStatuses('DRAFT')).toEqual(['SENT', 'REJECTED'])
  })
})

describe('statusForResponse', () => {
  it('mapeia cada ação de resposta para o status correspondente', () => {
    expect(statusForResponse('ACCEPT')).toBe('ACCEPTED')
    expect(statusForResponse('REJECT')).toBe('REJECTED')
    expect(statusForResponse('REQUEST_INFORMATION')).toBe('IN_NEGOTIATION')
  })
})

describe('canRespond', () => {
  it('permite responder propostas enviadas, em negociação ou recusadas', () => {
    expect(canRespond('SENT')).toBe(true)
    expect(canRespond('IN_NEGOTIATION')).toBe(true)
    expect(canRespond('REJECTED')).toBe(true)
  })

  it('não permite responder um rascunho — ainda não foi enviado ao corretor', () => {
    expect(canRespond('DRAFT')).toBe(false)
  })

  it('não permite responder de novo uma oportunidade já aceita', () => {
    expect(canRespond('ACCEPTED')).toBe(false)
  })
})
