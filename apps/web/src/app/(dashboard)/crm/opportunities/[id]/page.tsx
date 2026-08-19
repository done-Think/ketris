import { OpportunityDetail } from '@modules/crm/components/OpportunityDetail'

type CrmOpportunityPageProps = {
  params: { id: string }
}

export default function CrmOpportunityPage({ params }: CrmOpportunityPageProps) {
  return <OpportunityDetail opportunityId={params.id} />
}
