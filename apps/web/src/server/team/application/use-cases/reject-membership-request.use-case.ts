import {
  TeamMembershipRequestHasPortfolioError,
  TeamMembershipRequestNotFoundError,
} from '../../domain/errors'
import type { BrokerInput } from '../../types/use-case-inputs'
import type { TeamMembershipRequestRepository } from '../ports/team-membership-request-repository.port'
import { assertTeamManager } from '../team-access'

export class RejectMembershipRequestUseCase {
  constructor(private readonly requests: TeamMembershipRequestRepository) {}

  async execute(input: BrokerInput): Promise<void> {
    assertTeamManager(input)
    if (!(await this.requests.isPending(input.actorTenantId, input.brokerId)))
      throw new TeamMembershipRequestNotFoundError()
    if (await this.requests.hasPortfolio(input.actorTenantId, input.brokerId))
      throw new TeamMembershipRequestHasPortfolioError()
    if (!(await this.requests.deletePending(input.actorTenantId, input.brokerId)))
      throw new TeamMembershipRequestNotFoundError()
  }
}
