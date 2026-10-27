'use client'

import { useState } from 'react'
import { Box, Container } from '@mui/material'

import { SiteFooter } from '@shared/components/layout'

import { getPropertyDetailNavigationItemId } from '../config/navigation'
import { useMarketplaceNavigation } from '../hooks/use-marketplace-navigation'
import type { PropertyDetailPageProps } from '../types/property-detail'
import { MarketplaceHeader } from './MarketplaceHeader'
import { PropertyBreadcrumbs } from './PropertyBreadcrumbs'
import { PropertyContactCard } from './property-detail/PropertyContactCard'
import { PropertyGallery } from './property-detail/PropertyGallery'
import { PropertyOverview } from './property-detail/PropertyOverview'
import { PropertyPhotoDialog } from './property-detail/PropertyPhotoDialog'
import { styles } from '../styles/property-detail-page.styles'

export function PropertyDetailPage({
  activePurpose,
  breadcrumbContext,
  property,
}: PropertyDetailPageProps) {
  const { footerColumns, legalLinks } = useMarketplaceNavigation()
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const activeItemId = getPropertyDetailNavigationItemId({
    activePurpose,
    originType: breadcrumbContext?.originType,
    purpose: breadcrumbContext?.purpose,
  })

  const openGallery = (photoIndex: number) => {
    setActivePhotoIndex(photoIndex)
    setIsGalleryOpen(true)
  }

  const showPreviousPhoto = () => {
    setActivePhotoIndex((current) => (current === 0 ? property.gallery.length - 1 : current - 1))
  }

  const showNextPhoto = () => {
    setActivePhotoIndex((current) => (current === property.gallery.length - 1 ? 0 : current + 1))
  }

  return (
    <Box sx={styles.box}>
      <MarketplaceHeader activeItemId={activeItemId} />

      <Container component="main" maxWidth="xl" sx={styles.container}>
        <PropertyBreadcrumbs
          context={breadcrumbContext}
          location={property.location}
          propertyTitle={property.title}
        />

        <Box sx={styles.box2}>
          <Box sx={styles.box3}>
            <PropertyGallery property={property} onOpenPhoto={openGallery} />
            <PropertyOverview property={property} />
          </Box>

          <PropertyContactCard property={property} />
        </Box>
      </Container>

      <PropertyPhotoDialog
        activePhotoIndex={activePhotoIndex}
        onClose={() => setIsGalleryOpen(false)}
        onNextPhoto={showNextPhoto}
        onPreviousPhoto={showPreviousPhoto}
        onSelectPhoto={setActivePhotoIndex}
        open={isGalleryOpen}
        property={property}
      />

      <SiteFooter columns={footerColumns} legalLinks={legalLinks} />
    </Box>
  )
}
