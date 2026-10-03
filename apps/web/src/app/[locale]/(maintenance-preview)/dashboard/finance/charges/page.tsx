import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { ChargesPage } from '@modules/financial'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params
  return createLocalizedMetadata('charges.metadata', locale)
}

export default function DashboardChargesPage() {
  return <ChargesPage />
}
