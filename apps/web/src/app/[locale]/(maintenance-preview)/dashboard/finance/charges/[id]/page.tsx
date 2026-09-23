import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { ChargeDetailsPage } from '@modules/financial'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params
  return createLocalizedMetadata('charges.metadata', locale)
}

export default async function DashboardChargeDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ChargeDetailsPage chargeId={id} />
}
