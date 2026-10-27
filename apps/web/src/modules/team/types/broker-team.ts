import type { z } from 'zod'

import type {
  createAcceptInvitationSchema,
  createBrokerDeactivateSchema,
  createBrokerGoalSchema,
  createBrokerInviteSchema,
  createBrokerTransferSchema,
} from '../schemas/broker-team-action-schemas'
import type { BrokerTeamMenuAction, BrokerTeamMenuState, TeamMember } from './team'

export type BrokerGoalFormInput = z.input<ReturnType<typeof createBrokerGoalSchema>>
export type BrokerGoalFormValues = z.infer<ReturnType<typeof createBrokerGoalSchema>>
export type BrokerTransferFormValues = z.infer<ReturnType<typeof createBrokerTransferSchema>>
export type BrokerDeactivateFormValues = z.infer<ReturnType<typeof createBrokerDeactivateSchema>>
export type BrokerInviteFormValues = z.infer<ReturnType<typeof createBrokerInviteSchema>>
export type AcceptInvitationFormValues = z.infer<ReturnType<typeof createAcceptInvitationSchema>>

export interface TransferDestination {
  id: string
  label: string
}

export interface BrokerTeamCardProps {
  member: TeamMember
  isMenuOpen: boolean
  onOpenProfile: (member: TeamMember) => void
  onOpenMenu: (anchorEl: HTMLElement, member: TeamMember) => void
}

export interface BrokerMemberDialogProps {
  member: TeamMember
  onClose: () => void
}

export interface BrokerDestinationDialogProps extends BrokerMemberDialogProps {
  destinations: TransferDestination[]
}

export interface BrokerInviteDialogProps {
  onClose: () => void
}

export interface TeamKpisProps {
  summary: {
    activeBrokers: number
    properties: number
    monthlySales: number
    averageGoalProgress: number | null
  }
  pendingInvitations: number
}

export interface TeamMembershipRequestsProps {
  enabled: boolean
}

export interface AcceptInvitationScreenProps {
  token: string | null
}

export interface BrokerTeamMenuProps {
  menu: BrokerTeamMenuState | null
  onClose: () => void
  onSelect: (action: BrokerTeamMenuAction) => void
}

export interface TeamDialogTitleProps {
  title: string
  onClose: () => void
}
