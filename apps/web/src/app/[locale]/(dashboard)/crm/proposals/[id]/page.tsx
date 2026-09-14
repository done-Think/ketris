import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { ProposalDetailPage } from '@modules/proposals/components/ProposalDetailPage'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('crm.metadata.proposalDetail', locale)
}

export default async function CrmProposalDetailRoute({
  params,
}: LocaleRoutePageProps<{ id: string }>) {
  const { id } = await params

  return <ProposalDetailPage proposalId={id} />
}
