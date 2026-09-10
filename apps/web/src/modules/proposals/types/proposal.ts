export type ProposalStatus = 'underReview' | 'counteroffer' | 'approved'

export type DashboardProposal = {
  id: string
  client: string
  property: string
  value: string
  ownerExpectation: string
  status: ProposalStatus
}

export type ProposalDetailDialogProps = {
  onStatusChange: (proposalId: string, status: ProposalStatus) => void
  onClose: () => void
  open: boolean
  proposal: DashboardProposal | null
}

export type ProposalStatusFormValues = {
  status: ProposalStatus
}
