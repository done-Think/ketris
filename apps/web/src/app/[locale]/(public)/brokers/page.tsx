import { createLocalizedMetadata } from '@/i18n/metadata'
import { BrokersPage } from '@modules/marketplace'

export const generateMetadata = () => createLocalizedMetadata('marketplace.metadata.brokers')

export default function BrokersRoutePage() {
  return <BrokersPage />
}
