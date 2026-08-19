export type ProposalStatus = 'Em análise' | 'Contraproposta' | 'Aprovada'

export type DashboardProposal = {
  id: string
  client: string
  property: string
  value: string
  ownerExpectation: string
  status: ProposalStatus
}
