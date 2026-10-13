import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { EditPropertyDashboardPage } from '@modules/properties'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('properties.metadata.edit', locale)
}

export default async function EditDashboardPropertyRoute({
  params,
}: LocaleRoutePageProps<{ id: string }>) {
  const { id } = await params

  return <EditPropertyDashboardPage propertyId={id} />
}
