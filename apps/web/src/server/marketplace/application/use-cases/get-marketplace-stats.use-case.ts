import type { MarketplaceStats } from '../../types/marketplace-stats'
import type { MarketplaceStatsReader } from '../ports/marketplace-stats-reader.port'

export class GetMarketplaceStatsUseCase {
  constructor(private readonly reader: MarketplaceStatsReader) {}

  execute(): Promise<MarketplaceStats> {
    return this.reader.read()
  }
}
