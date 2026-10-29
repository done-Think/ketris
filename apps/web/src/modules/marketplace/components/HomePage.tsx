import { Box } from '@mui/material'

import { styles } from '../styles/home-page.styles'
import { FeaturedPropertiesSection } from './FeaturedPropertiesSection'
import { HomeHeroArea } from './HomeHeroArea'
import { MarketplaceFooter } from './MarketplaceFooter'
import { MiniPropertiesSection } from './MiniPropertiesSection'

export function HomePage() {
  return (
    <Box sx={styles.page}>
      <HomeHeroArea />
      <FeaturedPropertiesSection />
      <MiniPropertiesSection />
      <MarketplaceFooter />
    </Box>
  )
}
