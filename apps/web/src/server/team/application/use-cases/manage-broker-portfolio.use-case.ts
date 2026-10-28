import {
  CannotDeactivateSelfFromTeamError,
  EmptyTransferError,
  InvalidTransferDestinationError,
  TeamMemberNotFoundError,
} from '../../domain/errors'
import type { TeamActor, TeamTransferResult } from '../../types/team'
import type {
  BrokerInput,
  DeactivateBrokerInput,
  TransferBrokerPortfolioInput,
} from '../../types/use-case-inputs'
import type { TeamRepository } from '../ports/team-repository.port'
import { assertTeamManager, teamActorIdentity } from '../team-access'

async function assertTransferPeople(
  repository: TeamRepository,
  actor: TeamActor,
  brokerId: string,
  destinationId: string,
) {
  const [source, destination] = await Promise.all([
    repository.findStaffUser(actor.actorTenantId, brokerId),
    repository.findStaffUser(actor.actorTenantId, destinationId),
  ])
  if (!source || source.role !== 'AGENT') throw new TeamMemberNotFoundError()
  if (
    !destination ||
    destination.id === source.id ||
    !destination.active ||
    destination.pendingInvitation
  )
    throw new InvalidTransferDestinationError()

  return source
}

export class TransferBrokerPortfolioUseCase {
  constructor(
    private readonly repository: TeamRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: TransferBrokerPortfolioInput): Promise<TeamTransferResult> {
    assertTeamManager(input)
    if (!Object.values(input.items).some(Boolean)) throw new EmptyTransferError()
    await assertTransferPeople(this.repository, input, input.brokerId, input.destinationId)
    const actor = await teamActorIdentity(this.repository, input)

    return this.repository.transfer({
      tenantId: input.actorTenantId,
      sourceId: input.brokerId,
      destinationId: input.destinationId,
      items: input.items,
      opportunityScope: 'open',
      reason: 'MANUAL',
      actor,
      now: this.now(),
    })
  }
}

export class DeactivateBrokerUseCase {
  constructor(
    private readonly repository: TeamRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: DeactivateBrokerInput): Promise<TeamTransferResult> {
    assertTeamManager(input)
    if (input.brokerId === input.actorId) throw new CannotDeactivateSelfFromTeamError()
    const source = await assertTransferPeople(
      this.repository,
      input,
      input.brokerId,
      input.destinationId,
    )
    if (!source.active) throw new TeamMemberNotFoundError()
    const actor = await teamActorIdentity(this.repository, input)

    return this.repository.deactivateWithTransfer({
      tenantId: input.actorTenantId,
      sourceId: input.brokerId,
      destinationId: input.destinationId,
      items: { properties: true, leads: true, opportunities: true, futureEvents: true },
      opportunityScope: 'all',
      reason: 'DEACTIVATION',
      actor,
      now: this.now(),
    })
  }
}

export class ActivateBrokerUseCase {
  constructor(private readonly repository: TeamRepository) {}

  async execute(input: BrokerInput): Promise<void> {
    assertTeamManager(input)
    const broker = await this.repository.findStaffUser(input.actorTenantId, input.brokerId)
    if (!broker || broker.role !== 'AGENT') throw new TeamMemberNotFoundError()
    await this.repository.activate(input.actorTenantId, input.brokerId, input.actorId)
  }
}
