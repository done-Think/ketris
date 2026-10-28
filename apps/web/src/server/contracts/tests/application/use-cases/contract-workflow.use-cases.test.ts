import { describe, expect, it, vi } from 'vitest'
import { EditContractUseCase } from '../../../application/use-cases/edit-contract.use-case'
import { TransitionContractUseCase } from '../../../application/use-cases/transition-contract.use-case'
import { ListContractHistoryUseCase } from '../../../application/use-cases/list-contract-history.use-case'
import type { ContractWorkflowRepository } from '../../../application/ports/contract-workflow-repository.port'
import { contractFixture } from '../../fixtures/contract'
import { documentActor } from '../../fixtures/document'

function setup() {
  const contract = contractFixture()
  const repository = {
    edit: vi.fn<ContractWorkflowRepository['edit']>().mockResolvedValue(contract),
    transition: vi.fn<ContractWorkflowRepository['transition']>().mockResolvedValue(contract),
    signParty: vi.fn<ContractWorkflowRepository['signParty']>(),
    history: vi.fn<ContractWorkflowRepository['history']>(),
  }
  const data = {
    type: contract.type,
    amount: contract.amount,
    dueDay: contract.dueDay,
    startDate: contract.startDate,
    endDate: contract.endDate,
    adjustmentIndex: contract.adjustmentIndex,
    guaranteeType: contract.guaranteeType,
    notes: contract.notes,
    parties: contract.parties.map(({ role, name, cpf, email, phone }) => ({
      role,
      name,
      cpf,
      email,
      phone,
    })),
  }
  return {
    repository,
    contract,
    data,
    edit: new EditContractUseCase(repository),
    transition: new TransitionContractUseCase(repository),
    history: new ListContractHistoryUseCase(repository),
  }
}

describe('casos de uso do ciclo de vida de Contracts', () => {
  it('edita somente no tenant e responsabilidade do corretor, sem transferir a origem', async () => {
    const { repository, contract, data, edit } = setup()
    expect(await edit.execute({ ...documentActor, actorRole: 'AGENT', data })).toBe(contract)
    expect(repository.edit).toHaveBeenCalledWith(
      'contract',
      { tenantId: 'agency', actorId: 'manager', responsibleId: 'manager' },
      data,
    )
    expect(data).not.toHaveProperty('propertyId')
    expect(data).not.toHaveProperty('opportunityId')
  })

  it('exige a parte fiadora quando a garantia é FIADOR', () => {
    const { repository, data, edit } = setup()
    expect(() =>
      edit.execute({ ...documentActor, data: { ...data, guaranteeType: 'GUARANTOR' } }),
    ).toThrow()
    expect(repository.edit).not.toHaveBeenCalled()
  })

  it.each(['RENTER', 'PROPERTY_OWNER'] as const)(
    'impede gerenciamento por %s sem gravar',
    (actorRole) => {
      const { repository, data, edit, transition } = setup()
      expect(() => edit.execute({ ...documentActor, actorRole, data })).toThrow()
      expect(() =>
        transition.execute({ ...documentActor, actorRole, action: 'CLOSE', reason: 'Motivo' }),
      ).toThrow()
      expect(repository.edit).not.toHaveBeenCalled()
      expect(repository.transition).not.toHaveBeenCalled()
    },
  )

  it.each(['CANCEL', 'CLOSE'] as const)(
    'encaminha %s com autoria e motivo normalizado',
    async (action) => {
      const { repository, transition } = setup()
      await transition.execute({ ...documentActor, action, reason: '  Motivo informado  ' })
      expect(repository.transition).toHaveBeenCalledWith(
        'contract',
        { tenantId: 'agency', actorId: 'manager' },
        { action, reason: 'Motivo informado' },
      )
    },
  )

  it.each([' ', 'a'.repeat(10001)])('recusa motivo vazio ou acima do limite', (reason) => {
    const { repository, transition } = setup()
    expect(() => transition.execute({ ...documentActor, action: 'CANCEL', reason })).toThrow()
    expect(repository.transition).not.toHaveBeenCalled()
  })

  it.each([
    { actorRole: 'OWNER' as const, scope: { kind: 'tenant', tenantId: 'agency' } },
    {
      actorRole: 'AGENT' as const,
      scope: { kind: 'tenant', tenantId: 'agency', responsibleId: 'manager' },
    },
    { actorRole: 'RENTER' as const, scope: { kind: 'party', userId: 'manager' } },
    {
      actorRole: 'PROPERTY_OWNER' as const,
      scope: { kind: 'propertyOwner', tenantId: 'agency', ownerId: 'manager' },
    },
  ])('consulta histórico com o escopo de $actorPapel e paginação', async ({ actorRole, scope }) => {
    const { repository, history } = setup()
    await history.execute({ ...documentActor, actorRole, page: 3, pageSize: 10 })
    expect(repository.history).toHaveBeenCalledWith('contract', scope, 3, 10)
  })
})
