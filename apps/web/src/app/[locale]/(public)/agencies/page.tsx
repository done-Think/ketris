import { createLocalizedMetadata } from '@/i18n/metadata'
import { AgenciesPage } from '@modules/marketplace'

export const generateMetadata = () => createLocalizedMetadata('marketplace.metadata.agencies')

export default function AgenciesRoutePage() {
  return <AgenciesPage />
}
