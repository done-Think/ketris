import { createLocalizedMetadata } from '@/i18n/metadata'
import { CreatePropertyDashboardPage } from '@modules/properties'

export const generateMetadata = () => createLocalizedMetadata('properties.metadata.create')

export default function CreateDashboardPropertyPage() {
  return <CreatePropertyDashboardPage />
}
