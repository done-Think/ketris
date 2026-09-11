import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { OpportunityDetail } from '@modules/crm/components/OpportunityDetail'

export default async function CrmOpportunityPage({ params }: LocaleRoutePageProps<{ id: string }>) {
  const { id } = await params

  return <OpportunityDetail opportunityId={id} />
}
