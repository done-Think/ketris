import type { components, paths } from '@shared/types/generated/api'

import type { ReactNode } from 'react'

export type TeamMembershipRequest = Pick<
  components['schemas']['AuthenticatedUserResponse'],
  'id' | 'name' | 'email' | 'role' | 'pendingApproval'
>

export interface TeamMeetingDialogProps {
  member: TeamMember
  onClose: () => void
}

export interface BrokerTeamDashboardPageProps {
  renderMeetingDialog: (props: TeamMeetingDialogProps) => ReactNode
}

export type TeamPaceStatus = components['schemas']['TeamMember']['pace']['status']

export type TeamMember = components['schemas']['TeamMember']

export type TeamOverview = components['schemas']['TeamOverviewResponse']

export type TeamGoalChange = components['schemas']['TeamGoalChange']

export type TeamTransferCounts = components['schemas']['TeamTransferResponse']

export type TransferPortfolioPayload = components['schemas']['TransferBrokerPortfolioRequest']

export type InviteBrokerPayload = components['schemas']['InviteBrokerRequest']

export type InviteBrokerResult = components['schemas']['InviteBrokerResponse']

export type TeamInvitationPreview = components['schemas']['TeamInvitationPreview']

export type TeamMemberState = 'active' | 'inactive' | 'invited'

export type BrokerTeamMenuAction =
  | 'performance'
  | 'editGoal'
  | 'transferPortfolio'
  | 'scheduleOneOnOne'
  | 'deactivate'
  | 'activate'
  | 'resendInvitation'
  | 'cancelInvitation'

export type BrokerTeamDialog =
  | { type: 'invite' }
  | {
      type: Exclude<BrokerTeamMenuAction, 'activate' | 'resendInvitation'>
      member: TeamMember
    }

export interface BrokerTeamMenuState {
  anchorEl: HTMLElement
  member: TeamMember
}

export interface BrokerTeamListState {
  search: string
}

export type TeamMembershipRequestsResponse = components['schemas']['ListUsersResponse']
export type ApproveTeamMembershipResponse = components['schemas']['GetUserResponse']
export type TeamGoalHistoryResponse =
  paths['/team/members/{id}/goal']['get']['responses'][200]['content']['application/json']
export type TeamGoalResponse =
  paths['/team/members/{id}/goal']['put']['responses'][200]['content']['application/json']
export type TeamPortfolioTransferResponse =
  paths['/team/members/{id}/transfer']['post']['responses'][200]['content']['application/json']
export type TeamInvitationPreviewResponse =
  paths['/team/invitations/accept']['get']['responses'][200]['content']['application/json']
export type AcceptTeamInvitationResponse =
  paths['/team/invitations/accept']['post']['responses'][200]['content']['application/json']
export type ResendTeamInvitationResponse =
  paths['/team/invitations/{id}/resend']['post']['responses'][200]['content']['application/json']
