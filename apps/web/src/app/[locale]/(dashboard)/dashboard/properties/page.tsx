import { createLocalizedMetadata } from '@/i18n/metadata'
import { PropertiesDashboardPage } from '@modules/properties'

export const generateMetadata = () => createLocalizedMetadata('properties.metadata.dashboard')

export default function DashboardPropertiesPage() {
  return <PropertiesDashboardPage />
}
