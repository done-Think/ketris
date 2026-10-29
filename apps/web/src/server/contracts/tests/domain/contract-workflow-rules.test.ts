import { expect, it } from 'vitest'
import {
  assertContractEditable,
  assertContractTransition,
  contractChangedFields,
} from '../../domain/contract-workflow-rules'
import { contractFixture } from '../fixtures/contract'
import type { ContractEditData } from '../../types/workflow'

it.each(['DRAFT', 'IN_REVIEW', 'AWAITING_SIGNATURE'] as const)(
  'permite editar %s somente sem assinaturas',
  (status) => {
    expect(() =>
      assertContractEditable({ status, parties: [{ signatureStatus: 'PENDING' }] }),
    ).not.toThrow()
    expect(() =>
      assertContractEditable({ status, parties: [{ signatureStatus: 'SIGNED' }] }),
    ).toThrow()
  },
)
it.each(['SIGNED', 'ACTIVE', 'CLOSED', 'CANCELED'] as const)(
  'bloqueia edição no estado %s',
  (status) => {
    expect(() => assertContractEditable({ status, parties: [] })).toThrow()
  },
)
it('separa cancelamento de contratos não ativos e encerramento dos ativos', () => {
  expect(() => assertContractTransition('AWAITING_SIGNATURE', 'CANCEL')).not.toThrow()
  expect(() => assertContractTransition('ACTIVE', 'CLOSE')).not.toThrow()
  expect(() => assertContractTransition('ACTIVE', 'CANCEL')).toThrow()
  expect(() => assertContractTransition('AWAITING_SIGNATURE', 'CLOSE')).toThrow()
  expect(() => assertContractTransition('CANCELED', 'CANCEL')).toThrow()
  expect(() => assertContractTransition('CLOSED', 'CLOSE')).toThrow()
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
