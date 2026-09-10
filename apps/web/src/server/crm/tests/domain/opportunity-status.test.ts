import { describe, expect, it } from 'vitest'

import {
  allowedNextStatuses,
  canRespond,
  canTransition,
  statusForResponse,
} from '../../domain/opportunity-status'

describe('canTransition', () => {
  it('permite transições do funil normal', () => {
    expect(canTransition('RASCUNHO', 'ENVIADA')).toBe(true)
    expect(canTransition('ENVIADA', 'EM_NEGOCIACAO')).toBe(true)
    expect(canTransition('EM_NEGOCIACAO', 'ACEITA')).toBe(true)
    expect(canTransition('ENVIADA', 'RECUSADA')).toBe(true)
  })

  it('permite reabrir uma oportunidade recusada para negociação', () => {
    expect(canTransition('RECUSADA', 'EM_NEGOCIACAO')).toBe(true)
  })

  it('permite manter o mesmo status (no-op)', () => {
    expect(canTransition('ENVIADA', 'ENVIADA')).toBe(true)
    expect(canTransition('ACEITA', 'ACEITA')).toBe(true)
  })

  it('nunca permite sair de ACEITA — é terminal, pré-requisito do Contrato (FR-014)', () => {
    expect(canTransition('ACEITA', 'ENVIADA')).toBe(false)
    expect(canTransition('ACEITA', 'EM_NEGOCIACAO')).toBe(false)
    expect(canTransition('ACEITA', 'RECUSADA')).toBe(false)
    expect(canTransition('ACEITA', 'RASCUNHO')).toBe(false)
  })

  it('não permite pular direto de RASCUNHO para ACEITA', () => {
    expect(canTransition('RASCUNHO', 'ACEITA')).toBe(false)
  })

  it('não permite voltar de um status avançado para RASCUNHO', () => {
    expect(canTransition('ENVIADA', 'RASCUNHO')).toBe(false)
    expect(canTransition('EM_NEGOCIACAO', 'RASCUNHO')).toBe(false)
    expect(canTransition('RECUSADA', 'RASCUNHO')).toBe(false)
  })
})

describe('allowedNextStatuses', () => {
  it('reflete exatamente as regras de canTransition', () => {
    expect(allowedNextStatuses('ACEITA')).toEqual([])
    expect(allowedNextStatuses('RASCUNHO')).toEqual(['ENVIADA', 'RECUSADA'])
  })
})

describe('statusForResponse', () => {
  it('mapeia cada ação de resposta para o status correspondente', () => {
    expect(statusForResponse('ACEITAR')).toBe('ACEITA')
    expect(statusForResponse('RECUSAR')).toBe('RECUSADA')
    expect(statusForResponse('SOLICITAR_INFORMACOES')).toBe('EM_NEGOCIACAO')
  })
})

describe('canRespond', () => {
  it('permite responder propostas enviadas, em negociação ou recusadas', () => {
    expect(canRespond('ENVIADA')).toBe(true)
    expect(canRespond('EM_NEGOCIACAO')).toBe(true)
    expect(canRespond('RECUSADA')).toBe(true)
  })

  it('não permite responder um rascunho — ainda não foi enviado ao corretor', () => {
    expect(canRespond('RASCUNHO')).toBe(false)
  })

  it('não permite responder de novo uma oportunidade já aceita', () => {
    expect(canRespond('ACEITA')).toBe(false)
  })
})
