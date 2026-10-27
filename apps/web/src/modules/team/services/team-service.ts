import { BaseService } from '@shared/lib/api/base-service'

import type {
  InviteBrokerPayload,
  InviteBrokerResult,
  TeamGoalChange,
  TeamInvitationPreview,
  TeamOverview,
  TeamTransferCounts,
  TransferPortfolioPayload,
} from '../types/team'
import type { AppLocale } from '@/i18n/types/locale.types'

class TeamService extends BaseService {
  private readonly path = '/team'

  overview(): Promise<TeamOverview> {
    return this.http.get<TeamOverview>(this.path)
  }

  goals(memberId: string): Promise<TeamGoalChange[]> {
    return this.http
      .get<{ goals: TeamGoalChange[] }>(`${this.path}/members/${memberId}/goal`)
      .then((data) => data.goals)
  }

  setGoal(memberId: string, monthlySales: number): Promise<TeamGoalChange> {
    return this.http
      .put<{ goal: TeamGoalChange }>(`${this.path}/members/${memberId}/goal`, { monthlySales })
      .then((data) => data.goal)
  }

  transfer(memberId: string, payload: TransferPortfolioPayload): Promise<TeamTransferCounts> {
    return this.http
      .post<{ transferred: TeamTransferCounts }>(
        `${this.path}/members/${memberId}/transfer`,
        payload,
      )
      .then((data) => data.transferred)
  }

  deactivate(memberId: string, destinationId: string): Promise<TeamTransferCounts> {
    return this.http
      .post<{ transferred: TeamTransferCounts }>(`${this.path}/members/${memberId}/deactivate`, {
        destinationId,
      })
      .then((data) => data.transferred)
  }

  activate(memberId: string): Promise<void> {
    return this.http.post<void>(`${this.path}/members/${memberId}/activate`)
  }

  invite(payload: InviteBrokerPayload): Promise<InviteBrokerResult> {
    return this.http.post<InviteBrokerResult>(`${this.path}/invitations`, payload)
  }

  resendInvitation(memberId: string, locale: AppLocale): Promise<{ emailDelivered: boolean }> {
    return this.http.post<{ emailDelivered: boolean }>(
      `${this.path}/invitations/${memberId}/resend`,
      { locale },
    )
  }

  cancelInvitation(memberId: string): Promise<void> {
    return this.http.delete<void>(`${this.path}/invitations/${memberId}`)
  }

  previewInvitation(token: string): Promise<TeamInvitationPreview> {
    return this.http
      .get<{ invitation: TeamInvitationPreview }>(`${this.path}/invitations/accept`, {
        params: { token },
      })
      .then((data) => data.invitation)
  }

  acceptInvitation(token: string, password: string): Promise<{ email: string }> {
    return this.http.post<{ email: string }>(`${this.path}/invitations/accept`, {
      token,
      password,
    })
  }
}

export const teamService = new TeamService()
