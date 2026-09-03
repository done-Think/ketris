export type ProposalStatus = 'underReview' | 'counteroffer' | 'approved'

export type DashboardProposal = {
  id: string
  client: string
  property: string
  value: string
  ownerExpectation: string
  status: ProposalStatus
}
