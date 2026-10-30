'use client'

import { Box } from '@mui/material'
import { useMarketplaceSearch } from '../hooks/use-marketplace-search'
import { useMarketplaceStats } from '../hooks/use-marketplace-stats'

import { styles } from '../styles/home-page.styles'
import { FeaturedPropertiesSection } from './FeaturedPropertiesSection'
import { HomeHeroArea } from './HomeHeroArea'
import { MarketplaceFooter } from './MarketplaceFooter'
import { MiniPropertiesSection } from './MiniPropertiesSection'

export function HomePage() {
  const { data: stats } = useMarketplaceStats()
  const search = useMarketplaceSearch(stats?.locations)
  return (
    <Box sx={styles.page}>
      <HomeHeroArea search={search} />
      <FeaturedPropertiesSection purpose={search.purpose} />
      <MiniPropertiesSection purpose={search.purpose} />
      <MarketplaceFooter />
    </Box>
  )
}
