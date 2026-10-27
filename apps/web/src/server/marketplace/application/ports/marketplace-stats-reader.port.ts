import type { MarketplaceStats } from '../../types/marketplace-stats'

export interface MarketplaceStatsReader {
  read(): Promise<MarketplaceStats>
}
