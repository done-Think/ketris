import { BaseService } from '@shared/lib/api/base-service'

import type {
  InviteBrokerPayload,
  InviteBrokerResult,
  TeamGoalChange,
  TeamInvitationPreview,
  TeamOverview,
  TeamTransferCounts,
  TransferPortfolioPayload,
  TeamMembershipRequest,
  TeamMembershipRequestsResponse,
  ApproveTeamMembershipResponse,
  TeamGoalHistoryResponse,
  TeamGoalResponse,
  TeamPortfolioTransferResponse,
  TeamInvitationPreviewResponse,
  AcceptTeamInvitationResponse,
  ResendTeamInvitationResponse,
} from '../types/team'
import type { AppLocale } from '@/i18n/types/locale.types'

class TeamService extends BaseService {
  private readonly path = '/team'

  overview(): Promise<TeamOverview> {
    return this.http.get<TeamOverview>(this.path)
  }

  async membershipRequests(): Promise<TeamMembershipRequest[]> {
    const users: TeamMembershipRequest[] = []
    let page = 1
    while (true) {
      const result = await this.http.get<TeamMembershipRequestsResponse>('/auth/users', {
        params: { pendingApproval: true, page, pageSize: 100 },
      })
      users.push(...result.users)
      if (!result.users.length || page * result.pageSize >= result.total) return users
      page += 1
    }
  }

  approveMembership(userId: string): Promise<TeamMembershipRequest> {
    return this.http
      .patch<ApproveTeamMembershipResponse>(`/auth/users/${userId}/approve`)
      .then((response) => response.user)
  }

  goals(memberId: string): Promise<TeamGoalChange[]> {
    return this.http
      .get<TeamGoalHistoryResponse>(`${this.path}/members/${memberId}/goal`)
      .then((data) => data.goals)
  }

  setGoal(memberId: string, monthlySales: number): Promise<TeamGoalChange> {
    return this.http
      .put<TeamGoalResponse>(`${this.path}/members/${memberId}/goal`, { monthlySales })
      .then((data) => data.goal)
  }

  transfer(memberId: string, payload: TransferPortfolioPayload): Promise<TeamTransferCounts> {
    return this.http
      .post<TeamPortfolioTransferResponse>(`${this.path}/members/${memberId}/transfer`, payload)
      .then((data) => data.transferred)
  }

  deactivate(memberId: string, destinationId: string): Promise<TeamTransferCounts> {
    return this.http
      .post<TeamPortfolioTransferResponse>(`${this.path}/members/${memberId}/deactivate`, {
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

  resendInvitation(memberId: string, locale: AppLocale): Promise<ResendTeamInvitationResponse> {
    return this.http.post<ResendTeamInvitationResponse>(
      `${this.path}/invitations/${memberId}/resend`,
      { locale },
    )
  }

  cancelInvitation(memberId: string): Promise<void> {
    return this.http.delete<void>(`${this.path}/invitations/${memberId}`)
  }

  previewInvitation(token: string): Promise<TeamInvitationPreview> {
    return this.http
      .get<TeamInvitationPreviewResponse>(`${this.path}/invitations/accept`, {
        params: { token },
      })
      .then((data) => data.invitation)
  }

  acceptInvitation(token: string, password: string): Promise<AcceptTeamInvitationResponse> {
    return this.http.post<AcceptTeamInvitationResponse>(`${this.path}/invitations/accept`, {
      token,
      password,
    })
  }
}

export const teamService = new TeamService()
