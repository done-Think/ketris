'use client'

import { useRef, useState } from 'react'
import { Box, Container } from '@mui/material'

import { HomeHeader, ProfileModal, SiteFooter } from '@shared/components/layout'
import { surface } from '@shared/theme/tokens'

import { footerColumns, homeNavigationItems, legalLinks } from '../config/navigation'
import { profileActions, userProfile } from '../data/user-profile'
import type { PropertyDetailPageProps } from '../types/property-detail'
import { PropertyBreadcrumbs } from './PropertyBreadcrumbs'
import { PropertyContactCard } from './property-detail/PropertyContactCard'
import { PropertyGallery } from './property-detail/PropertyGallery'
import { PropertyOverview } from './property-detail/PropertyOverview'
import { PropertyPhotoDialog } from './property-detail/PropertyPhotoDialog'

export function PropertyDetailPage({
  activePurpose,
  breadcrumbContext,
  property,
}: PropertyDetailPageProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileButtonRef = useRef<HTMLButtonElement | null>(null)
  const navigationItems = homeNavigationItems.map((item) => ({
    ...item,
    active: activePurpose ? item.href.includes(`finalidade=${activePurpose}`) : false,
  }))

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
    <Box sx={{ bgcolor: surface.app, minHeight: '100vh', overflowX: 'clip' }}>
      <HomeHeader
        navigationItems={navigationItems}
        profileButtonRef={profileButtonRef}
        userProfile={userProfile}
        onToggleProfile={() => setIsProfileOpen((current) => !current)}
      />

      <ProfileModal
        open={isProfileOpen}
        anchorRef={profileButtonRef}
        actions={profileActions}
        userProfile={userProfile}
        onClose={() => setIsProfileOpen(false)}
      />

      <Container component="main" maxWidth="xl" sx={{ py: { xs: 2.5, md: 4 } }}>
        <PropertyBreadcrumbs
          category={property.category}
          context={breadcrumbContext}
          location={property.location}
          propertyTitle={property.title}
        />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 355px' },
            gap: { xs: 2.5, lg: 3.5 },
            alignItems: 'start',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
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
