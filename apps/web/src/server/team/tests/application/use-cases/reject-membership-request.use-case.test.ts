import { describe, expect, it } from 'vitest'

import { ForbiddenError } from '@server/shared/errors'

import { RejectMembershipRequestUseCase } from '../../../application/use-cases/reject-membership-request.use-case'
import {
  TeamMembershipRequestHasPortfolioError,
  TeamMembershipRequestNotFoundError,
} from '../../../domain/errors'
import { membershipRequestRepository, owner } from './team-fixtures'

describe('RejectMembershipRequestUseCase', () => {
  it('apaga o cadastro pendente do corretor na imobiliária de quem recusa', async () => {
    const requests = membershipRequestRepository()

    await new RejectMembershipRequestUseCase(requests).execute({ ...owner, brokerId: 'agent-9' })

    expect(requests.isPending).toHaveBeenCalledWith('tenant-1', 'agent-9')
    expect(requests.deletePending).toHaveBeenCalledWith('tenant-1', 'agent-9')
  })

  it.each(['AGENT', 'RENTER', 'PROPERTY_OWNER'] as const)(
    'só a gestão da imobiliária pode recusar (%s não pode)',
    async (actorRole) => {
      const requests = membershipRequestRepository()

      await expect(
        new RejectMembershipRequestUseCase(requests).execute({
          ...owner,
          actorRole,
          brokerId: 'agent-9',
        }),
      ).rejects.toBeInstanceOf(ForbiddenError)
      expect(requests.isPending).not.toHaveBeenCalled()
      expect(requests.deletePending).not.toHaveBeenCalled()
    },
  )

  it('não mexe em quem já foi aprovado, é de outra imobiliária ou não existe', async () => {
    const requests = membershipRequestRepository({ isPending: async () => false })

    await expect(
      new RejectMembershipRequestUseCase(requests).execute({ ...owner, brokerId: 'agent-9' }),
    ).rejects.toBeInstanceOf(TeamMembershipRequestNotFoundError)
    expect(requests.deletePending).not.toHaveBeenCalled()
  })

  it('bloqueia quando o corretor já tem carteira', async () => {
    const requests = membershipRequestRepository({ hasPortfolio: async () => true })

    await expect(
      new RejectMembershipRequestUseCase(requests).execute({ ...owner, brokerId: 'agent-9' }),
    ).rejects.toBeInstanceOf(TeamMembershipRequestHasPortfolioError)
    expect(requests.deletePending).not.toHaveBeenCalled()
  })

  it('avisa quando o pedido foi aprovado por outra pessoa no meio do caminho', async () => {
    const requests = membershipRequestRepository({ deletePending: async () => false })

    await expect(
      new RejectMembershipRequestUseCase(requests).execute({ ...owner, brokerId: 'agent-9' }),
    ).rejects.toBeInstanceOf(TeamMembershipRequestNotFoundError)
  })
})
