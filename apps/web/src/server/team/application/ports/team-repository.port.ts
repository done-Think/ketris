import type { TeamGoalChange, TeamPeriod, TeamTransferResult } from '../../types/team'
import type {
  TeamMemberRow,
  TeamMetricRows,
  TeamStaffUser,
  TeamTransferCommand,
} from '../../types/team-repository'

export interface TeamRepository {
  listMembers(tenantId: string): Promise<TeamMemberRow[]>
  loadMetrics(tenantId: string, memberIds: string[], period: TeamPeriod): Promise<TeamMetricRows>
  findStaffUser(tenantId: string, userId: string): Promise<TeamStaffUser | null>
  transfer(command: TeamTransferCommand): Promise<TeamTransferResult>
  deactivateWithTransfer(command: TeamTransferCommand): Promise<TeamTransferResult>
  activate(tenantId: string, userId: string, actorId: string): Promise<boolean>
  setGoal(
    tenantId: string,
    userId: string,
    monthlySales: number,
    actor: { id: string; name: string },
  ): Promise<TeamGoalChange>
  listGoals(tenantId: string, userId: string, limit: number): Promise<TeamGoalChange[]>
}
