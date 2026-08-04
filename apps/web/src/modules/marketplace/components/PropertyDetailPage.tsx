'use client'

import { useRef, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Container,
  Dialog,
  IconButton,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import BathtubOutlinedIcon from '@mui/icons-material/BathtubOutlined'
import BedOutlinedIcon from '@mui/icons-material/BedOutlined'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined'
import LocalParkingOutlinedIcon from '@mui/icons-material/LocalParkingOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined'
import SquareFootOutlinedIcon from '@mui/icons-material/SquareFootOutlined'

import { HomeHeader, ProfileModal, SiteFooter } from '@shared/components/layout'
import { alpha, componentText, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import { footerColumns, homeNavigationItems, legalLinks } from '../config/navigation'
import { profileActions, userProfile } from '../data/user-profile'
import type { MarketplacePropertyDetail } from '../data/property-details'
import { PropertyDetailMap } from './PropertyDetailMap'

type PropertyDetailPageProps = {
  property: MarketplacePropertyDetail
}

const featureIcons = [
  BedOutlinedIcon,
  BathtubOutlinedIcon,
  LocalParkingOutlinedIcon,
  SquareFootOutlinedIcon,
]

export function PropertyDetailPage({ property }: PropertyDetailPageProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const profileButtonRef = useRef<HTMLButtonElement | null>(null)
  const [cover, ...thumbs] = property.gallery
  const hiddenPhotosCount = Math.max(property.gallery.length - 4, 0)
  const hiddenPhotosLabel = hiddenPhotosCount === 1 ? '+1 foto' : `+${hiddenPhotosCount} fotos`

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
        navigationItems={homeNavigationItems}
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
        <Stack direction="row" spacing={0.8} sx={{ mb: 2 }}>
          {['Home', 'São Paulo', 'Jardins', property.category].map((item, index) => (
            <Typography
              key={item}
              sx={{
                color: index === 3 ? 'primary.main' : 'text.secondary',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {index > 0 ? `/ ${item}` : item}
            </Typography>
          ))}
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 355px' },
            gap: { xs: 2.5, lg: 3.5 },
            alignItems: 'start',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 230px' },
                gap: 1,
                mb: 3,
              }}
            >
              <Box
                component="button"
                type="button"
                aria-label="Abrir galeria de fotos do imóvel"
                onClick={() => openGallery(0)}
                sx={{
                  minHeight: { xs: 300, md: 470 },
                  borderRadius: `${radius.sm}px`,
                  backgroundImage: `url("${cover}")`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                  border: 0,
                  cursor: 'pointer',
                  display: 'block',
                  p: 0,
                  width: '100%',
                }}
              />
              <Box
                sx={{
                  display: { xs: 'none', md: 'grid' },
                  gridTemplateRows: 'repeat(3, 1fr)',
                  gap: 1,
                }}
              >
                {thumbs.slice(0, 3).map((image, index) => (
                  <Box
                    component="button"
                    type="button"
                    key={image}
                    aria-label={`Abrir foto ${index + 2} de ${property.gallery.length}`}
                    onClick={() => openGallery(index + 1)}
                    sx={{
                      position: 'relative',
                      borderRadius: `${radius.sm}px`,
                      backgroundImage: `url("${image}")`,
                      backgroundPosition: 'center',
                      backgroundSize: 'cover',
                      border: 0,
                      cursor: 'pointer',
                      overflow: 'hidden',
                      p: 0,
                    }}
                  >
                    {index === 2 ? (
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: 'rgba(13,15,20,0.52)',
                          color: surface.lightText,
                          fontWeight: 900,
                        }}
                      >
                        {hiddenPhotosCount ? hiddenPhotosLabel : 'Ver fotos'}
                      </Box>
                    ) : null}
                  </Box>
                ))}
              </Box>
            </Box>

            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography sx={{ color: 'primary.main', ...componentText.cardEyebrow }}>
                {property.location}
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 800 }}>
                / {property.category}
              </Typography>
            </Stack>

            <Typography variant="h3" sx={{ maxWidth: 760, mb: 2 }}>
              {property.title}
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              sx={{
                display: { xs: 'flex', lg: 'none' },
                mb: 3,
              }}
            >
              <Button
                startIcon={<FavoriteBorderOutlinedIcon />}
                variant="outlined"
                color="secondary"
              >
                Favoritar
              </Button>
              <Button startIcon={<ShareOutlinedIcon />} variant="outlined" color="secondary">
                Compartilhar
              </Button>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                gap: 1,
                mb: 4,
              }}
            >
              {property.details.map((detail, index) => {
                const Icon = featureIcons[index] ?? SquareFootOutlinedIcon

                return (
                  <Box
                    key={detail.key}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: `${radius.sm}px`,
                      bgcolor: surface.paper,
                      px: 2,
                      py: 1.8,
                    }}
                  >
                    <Icon sx={{ color: 'primary.main', fontSize: iconSize.lg, mb: 0.6 }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{detail.label}</Typography>
                  </Box>
                )
              })}
            </Box>

            <Typography variant="h5" sx={{ mb: 1.2 }}>
              Sobre o imóvel
            </Typography>
            <Typography sx={{ color: 'text.secondary', maxWidth: 820, mb: 4 }}>
              {property.description}
            </Typography>

            <Typography variant="h5" sx={{ mb: 1.2 }}>
              Localização
            </Typography>
            <Typography sx={{ color: 'text.secondary', mb: 1.4, fontWeight: 700 }}>
              {property.address}
            </Typography>
            <PropertyDetailMap
              latitude={property.mapCenter.latitude}
              longitude={property.mapCenter.longitude}
            />
          </Box>

          <Box
            sx={{
              position: { lg: 'sticky' },
              top: { lg: 84 },
              bgcolor: surface.paper,
              borderRadius: `${radius.sm}px`,
              boxShadow: shadows.propertyCard,
              p: 2,
            }}
          >
            <Typography color="primary" sx={{ fontSize: 28, fontWeight: 900, lineHeight: 1.15 }}>
              {property.price}
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 700, mb: 2 }}>
              Condominio {property.condominium}
            </Typography>

            <Stack spacing={1} sx={{ mb: 2 }}>
              <Button variant="contained" size="large" fullWidth>
                Agendar visita
              </Button>
              <Button variant="outlined" color="secondary" size="large" fullWidth>
                Enviar proposta
              </Button>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Stack direction="row" spacing={1.3} alignItems="center" sx={{ mb: 1.5 }}>
              <Avatar src={property.avatar} alt={property.broker} sx={{ width: 48, height: 48 }} />
              <Box>
                <Typography sx={{ fontWeight: 900 }}>{property.broker}</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 700 }}>
                  Corretor Ketris
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1}>
              {[
                { label: 'Ligar', icon: PhoneOutlinedIcon },
                { label: 'WhatsApp', icon: PhoneOutlinedIcon },
                { label: 'E-mail', icon: EmailOutlinedIcon },
              ].map(({ label, icon: Icon }) => (
                <Button
                  key={label}
                  variant="outlined"
                  color="secondary"
                  size="small"
                  startIcon={<Icon sx={{ fontSize: iconSize.xs }} />}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    borderColor: 'divider',
                    bgcolor: alpha.graphite[6],
                    fontSize: 11,
                  }}
                >
                  {label}
                </Button>
              ))}
            </Stack>
          </Box>
        </Box>
      </Container>

      <Dialog
        fullScreen
        open={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') showPreviousPhoto()
          if (event.key === 'ArrowRight') showNextPhoto()
        }}
        PaperProps={{
          sx: {
            bgcolor: surface.darkDeep,
            color: surface.lightText,
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            display: 'grid',
            gridTemplateRows: 'auto minmax(0, 1fr) auto',
            height: '100vh',
            px: { xs: 1.5, md: 3 },
            py: { xs: 1.5, md: 2.5 },
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
              {activePhotoIndex + 1} de {property.gallery.length}
            </Typography>
            <IconButton
              aria-label="Fechar galeria"
              onClick={() => setIsGalleryOpen(false)}
              sx={{ color: surface.lightText }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

          <Box
            sx={{
              position: 'relative',
              display: 'grid',
              placeItems: 'center',
              minHeight: 0,
            }}
          >
            <Box
              component="img"
              src={property.gallery[activePhotoIndex]}
              alt={`${property.title} - foto ${activePhotoIndex + 1}`}
              sx={{
                display: 'block',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: `${radius.sm}px`,
              }}
            />

            <IconButton
              aria-label="Foto anterior"
              onClick={showPreviousPhoto}
              sx={{
                position: 'absolute',
                left: { xs: 0, md: 12 },
                width: { xs: 42, md: 52 },
                height: { xs: 42, md: 52 },
                bgcolor: alpha.white[8],
                color: surface.lightText,
                '&:hover': {
                  bgcolor: alpha.white[50],
                },
              }}
            >
              <ChevronLeftRoundedIcon sx={{ fontSize: { xs: 30, md: 38 } }} />
            </IconButton>

            <IconButton
              aria-label="Próxima foto"
              onClick={showNextPhoto}
              sx={{
                position: 'absolute',
                right: { xs: 0, md: 12 },
                width: { xs: 42, md: 52 },
                height: { xs: 42, md: 52 },
                bgcolor: alpha.white[8],
                color: surface.lightText,
                '&:hover': {
                  bgcolor: alpha.white[50],
                },
              }}
            >
              <ChevronRightRoundedIcon sx={{ fontSize: { xs: 30, md: 38 } }} />
            </IconButton>
          </Box>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              overflowX: 'auto',
              py: 1,
              px: { xs: 0, md: 6 },
            }}
          >
            {property.gallery.map((image, index) => (
              <Box
                component="button"
                type="button"
                key={image}
                aria-label={`Ver foto ${index + 1}`}
                onClick={() => setActivePhotoIndex(index)}
                sx={{
                  flex: '0 0 auto',
                  width: { xs: 72, md: 96 },
                  height: { xs: 52, md: 68 },
                  borderRadius: `${radius.sm}px`,
                  border: '2px solid',
                  borderColor: index === activePhotoIndex ? 'primary.main' : 'transparent',
                  backgroundImage: `url("${image}")`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                  cursor: 'pointer',
                  opacity: index === activePhotoIndex ? 1 : 0.62,
                  p: 0,
                }}
              />
            ))}
          </Stack>
        </Box>
      </Dialog>

      <SiteFooter columns={footerColumns} legalLinks={legalLinks} />
    </Box>
  )
}
