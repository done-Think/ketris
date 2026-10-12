import type { AgencyBrandBannerProps } from '../types/agency'
import { AgencyAdaptiveBrandHeader } from './AgencyAdaptiveBrandHeader'

export function AgencyBrandBanner({ agency, size }: AgencyBrandBannerProps) {
  return (
    <AgencyAdaptiveBrandHeader agency={agency} variant={size === 'compact' ? 'compact' : 'hero'} />
  )
}
