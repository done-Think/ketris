export interface TeamFixtureInput {
  suffix: string
  password: string
}

export interface TeamFixtureResult {
  tenantIds: string[]
  ownerEmail: string
  sourceName: string
  destinationName: string
}

export interface TeamEvidence {
  sourceActive: boolean
  sourceProperties: number
  sourceLeads: number
  destinationProperties: number
  destinationLeads: number
  goal: number | null
  transfers: number
  invitedActive: boolean | null
  invitationAccepted: boolean
}

export interface TeamInvitationEmail {
  invitationUrl: string
}
