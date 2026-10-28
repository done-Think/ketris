import { TeamMemberNotFoundError } from '../../domain/errors'
import type { TeamActor, TeamGoalChange } from '../../types/team'
import type { BrokerInput, SetBrokerGoalInput } from '../../types/use-case-inputs'
import type { TeamRepository } from '../ports/team-repository.port'
import { assertTeamManager, teamActorIdentity } from '../team-access'

const GOAL_HISTORY_LIMIT = 10

async function assertBroker(repository: TeamRepository, actor: TeamActor, brokerId: string) {
  const broker = await repository.findStaffUser(actor.actorTenantId, brokerId)
  if (!broker || broker.role !== 'AGENT') throw new TeamMemberNotFoundError()
}

export class SetBrokerGoalUseCase {
  constructor(private readonly repository: TeamRepository) {}

  async execute(input: SetBrokerGoalInput): Promise<TeamGoalChange> {
    assertTeamManager(input)
    await assertBroker(this.repository, input, input.brokerId)
    const actor = await teamActorIdentity(this.repository, input)

    return this.repository.setGoal(input.actorTenantId, input.brokerId, input.monthlySales, actor)
  }
}

export class ListBrokerGoalsUseCase {
  constructor(private readonly repository: TeamRepository) {}

  async execute(input: BrokerInput): Promise<TeamGoalChange[]> {
    assertTeamManager(input)
    await assertBroker(this.repository, input, input.brokerId)

    return this.repository.listGoals(input.actorTenantId, input.brokerId, GOAL_HISTORY_LIMIT)
  }
}
