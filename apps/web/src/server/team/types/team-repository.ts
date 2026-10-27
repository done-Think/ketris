import type { TeamMemberInvitation, TeamTransferItems } from './team'

export interface TeamMemberRow {
  id: string
  name: string
  email: string
  phone: string | null
  avatarUrl: string | null
  headline: string | null
  specialties: string[]
  hasPublicProfile: boolean
  active: boolean
  invitation: TeamMemberInvitation | null
}

export interface TeamMetricRows {
  properties: Map<string, number>
  openLeads: Map<string, number>
  monthlySales: Map<string, number>
  returns: Map<string, number>
  responseMinutes: Map<string, number[]>
  goals: Map<string, { monthlySales: number; setAt: Date; setByName: string }>
}

export interface TeamTransferCommand {
  tenantId: string
  sourceId: string
  destinationId: string
  items: TeamTransferItems
  reason: 'MANUAL' | 'DESATIVACAO'
  actor: { id: string; name: string }
  now: Date
}

export interface TeamStaffUser {
  id: string
  name: string
  papel: string
  active: boolean
  pendingInvitation: boolean
}

export interface NewTeamInvitation {
  tenantId: string
  name: string
  email: string
  passwordHash: string
  tokenHash: string
  expiresAt: Date
  actor: { id: string; name: string }
}

export interface StoredTeamInvitation {
  userId: string
  tenantId: string
  tenantName: string
  name: string
  email: string
  expiresAt: Date
  acceptedAt: Date | null
}
