import { Box } from '@mui/material'

import { SiteFooter } from '@shared/components/layout'
import { surface } from '@shared/theme/tokens'

import { useMarketplaceNavigation } from '../hooks/use-marketplace-navigation'
import { FeaturedPropertiesSection } from './FeaturedPropertiesSection'
import { HomeHero } from './HomeHero'
import { MarketplaceHeader } from './MarketplaceHeader'
import { MiniPropertiesSection } from './MiniPropertiesSection'

// Server Component: the page shell and footer are rendered on the server; only the search and
// the property sections, which load data in the browser, are client islands.
export function HomePage() {
  const { footerColumns, legalLinks } = useMarketplaceNavigation()

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100vw',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'clip',
        bgcolor: surface.app,
      }}
    >
      <MarketplaceHeader activeItemId="home" />
      <HomeHero />
      <FeaturedPropertiesSection />
      <MiniPropertiesSection />
      <SiteFooter columns={footerColumns} legalLinks={legalLinks} />
    </Box>
  )
}
