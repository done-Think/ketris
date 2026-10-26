import { expect, it } from 'vitest'
import {
  assertContractEditable,
  assertContractTransition,
  contractChangedFields,
} from '../../domain/contract-workflow-rules'
import { contractFixture } from '../fixtures/contract'
import type { ContractEditData } from '../../types/workflow'

it.each(['RASCUNHO', 'EM_REVISAO', 'AGUARDANDO_ASSINATURA'] as const)(
  'permite editar %s somente sem assinaturas',
  (status) => {
    expect(() =>
      assertContractEditable({ status, parties: [{ signatureStatus: 'PENDENTE' }] }),
    ).not.toThrow()
    expect(() =>
      assertContractEditable({ status, parties: [{ signatureStatus: 'ASSINADA' }] }),
    ).toThrow()
  },
)
it.each(['ASSINADO', 'ATIVO', 'ENCERRADO', 'CANCELADO'] as const)(
  'bloqueia edição no estado %s',
  (status) => {
    expect(() => assertContractEditable({ status, parties: [] })).toThrow()
  },
)
it('separa cancelamento de contratos não ativos e encerramento dos ativos', () => {
  expect(() => assertContractTransition('AGUARDANDO_ASSINATURA', 'CANCEL')).not.toThrow()
  expect(() => assertContractTransition('ATIVO', 'CLOSE')).not.toThrow()
  expect(() => assertContractTransition('ATIVO', 'CANCEL')).toThrow()
  expect(() => assertContractTransition('AGUARDANDO_ASSINATURA', 'CLOSE')).toThrow()
  expect(() => assertContractTransition('CANCELADO', 'CANCEL')).toThrow()
  expect(() => assertContractTransition('ENCERRADO', 'CLOSE')).toThrow()
})
it('não invalida o PDF quando só muda a formatação do CPF, telefone ou e-mail', () => {
  const contract = contractFixture()
  const data: ContractEditData = {
    ...contract,
    parties: contract.parties.map((party) => ({
      ...party,
      cpf: '52998224725',
      phone: '(11) 99999-9999',
      email: party.email.toUpperCase(),
    })),
  }
  expect(contractChangedFields(contract, data)).toEqual([])
  expect(contractChangedFields(contract, { ...data, amount: 2450.76 })).toEqual(['amount'])
  expect(
    contractChangedFields(contract, {
      ...data,
      parties: [{ ...data.parties[0], email: 'other@example.test' }, data.parties[1]],
    }),
  ).toEqual(['parties'])
})
