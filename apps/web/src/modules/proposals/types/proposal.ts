export type ProposalStatus = 'underReview' | 'counteroffer' | 'approved'

export type DashboardProposal = {
  id: string
  client: string
  property: string
  value: string
  ownerExpectation: string
  status: ProposalStatus
}

export type ProposalStatusStyle = {
  bgcolor: string
  color: string
}

export type ProposalsListProps = {
  proposals: DashboardProposal[]
}

export type ProposalDetailDialogProps = {
  onClose: () => void
  open: boolean
  proposal: DashboardProposal | null
}
