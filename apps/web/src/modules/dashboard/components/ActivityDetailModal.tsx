'use client'

import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Link as MuiLink,
  Stack,
  Typography,
} from '@mui/material'
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import CloseIcon from '@mui/icons-material/Close'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre'
import { useTranslations } from 'next-intl'

import { env } from '@config/env'
import { alpha, brand, motion, radius, surface } from '@shared/theme/tokens'

import type { ActivityDetailModalProps } from '../types/dashboard-overview'
import { ContactInfoCard } from './ContactInfoCard'

const defaultMapStyleUrl = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
const mapContainerStyle = { width: '100%', height: '100%' } as const

export function ActivityDetailModal({ activity, onClose }: ActivityDetailModalProps) {
  const t = useTranslations('dashboard.overview.activityDetail')
  const property = activity?.property
  const mapStyleUrl =
    env.mapStyleUrl && !env.mapStyleUrl.includes('demotiles') ? env.mapStyleUrl : defaultMapStyleUrl

  return (
    <Dialog
      open={Boolean(activity)}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${radius.sm}px`,
            overflow: 'hidden',
          },
        },
      }}
    >
      {activity ? (
        <>
          <DialogTitle sx={{ px: { xs: 2, md: 2.6 }, py: 2 }}>
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={2}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 900 }}>
                  {activity.contact}
                </Typography>
                <Typography
                  noWrap
                  sx={{ color: brand.graphite[500], fontSize: { xs: 20, md: 24 }, fontWeight: 900 }}
                >
                  {activity.title}
                </Typography>
              </Box>
              <IconButton aria-label={t('close')} onClick={onClose} size="small">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </DialogTitle>

          <DialogContent sx={{ px: { xs: 2, md: 2.6 }, pb: 2.6 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' },
                gap: 1.6,
              }}
            >
              <MuiLink
                href={activity.location.directionsUrl}
                target="_blank"
                rel="noreferrer"
                underline="none"
                aria-label={t('openGpsAriaLabel', { address: activity.location.address })}
                sx={{
                  position: 'relative',
                  display: 'block',
                  minHeight: { xs: 230, md: 360 },
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: alpha.graphite[6],
                  borderRadius: `${radius.sm}px`,
                  bgcolor: surface.app,
                  cursor: 'pointer',
                  '&:hover [data-map-action="true"]': {
                    transform: 'translateY(-1px)',
                    bgcolor: brand.magenta[600],
                  },
                }}
              >
                <Map
                  initialViewState={{
                    latitude: activity.location.latitude,
                    longitude: activity.location.longitude,
                    zoom: 15,
                  }}
                  mapStyle={mapStyleUrl}
                  style={mapContainerStyle}
                  attributionControl={true}
                  interactive={false}
                >
                  <Marker
                    latitude={activity.location.latitude}
                    longitude={activity.location.longitude}
                    anchor="center"
                  >
                    <Box
                      sx={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        bgcolor: brand.magenta[500],
                        border: '4px solid',
                        borderColor: surface.paper,
                        boxShadow: `0 10px 24px ${alpha.magenta[36]}`,
                      }}
                    />
                  </Marker>
                  <NavigationControl position="bottom-right" showCompass={false} />
                </Map>
                <Box
                  data-map-action="true"
                  sx={{
                    position: 'absolute',
                    right: 14,
                    bottom: 14,
                    borderRadius: `${radius.sm}px`,
                    bgcolor: brand.magenta[500],
                    color: surface.lightText,
                    px: 1.2,
                    py: 0.8,
                    fontSize: 12,
                    fontWeight: 900,
                    transition: motion.transition.interactive,
                  }}
                >
                  {t('openGps')}
                </Box>
              </MuiLink>

              <Stack spacing={1.4}>
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: alpha.graphite[6],
                    borderRadius: `${radius.sm}px`,
                    p: 1.6,
                  }}
                >
                  <Stack spacing={1.2}>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <AccessTimeOutlinedIcon sx={{ color: brand.magenta[500], fontSize: 19 }} />
                      <Box>
                        <Typography
                          sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 900 }}
                        >
                          {t('meetingTime')}
                        </Typography>
                        <Typography
                          sx={{ color: brand.graphite[500], fontSize: 16, fontWeight: 900 }}
                        >
                          {activity.meetingTime}
                        </Typography>
                      </Box>
                    </Stack>

                    <Divider />

                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <LocationOnOutlinedIcon sx={{ color: brand.magenta[500], fontSize: 19 }} />
                      <Box>
                        <Typography
                          sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 900 }}
                        >
                          {t('location')}
                        </Typography>
                        <Typography
                          sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 900 }}
                        >
                          {activity.location.name}
                        </Typography>
                        <Typography
                          sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 700 }}
                        >
                          {activity.location.address}
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: property ? { xs: '1fr', sm: '1fr 1fr' } : '1fr',
                    gap: 1,
                  }}
                >
                  <ContactInfoCard
                    label={t('client')}
                    name={activity.client.name}
                    phone={activity.client.phone}
                  />
                  {property ? (
                    <ContactInfoCard
                      label={t('owner')}
                      name={property.owner.name}
                      phone={property.owner.phone}
                    />
                  ) : null}
                </Box>

                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: alpha.graphite[6],
                    borderRadius: `${radius.sm}px`,
                    p: 1.6,
                  }}
                >
                  <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 900 }}>
                    {t('notes')}
                  </Typography>
                  <Typography
                    sx={{ color: brand.graphite[500], fontSize: 13, fontWeight: 700, mt: 0.6 }}
                  >
                    {activity.notes}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {property ? (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '240px 1fr' },
                  gap: 1.6,
                  mt: 1.6,
                  border: '1px solid',
                  borderColor: alpha.graphite[6],
                  borderRadius: `${radius.sm}px`,
                  overflow: 'hidden',
                }}
              >
                <Box
                  component="img"
                  src={property.imageUrl}
                  alt={property.title}
                  sx={{
                    display: 'block',
                    width: '100%',
                    height: { xs: 190, md: '100%' },
                    objectFit: 'cover',
                  }}
                />
                <Box sx={{ p: 1.8 }}>
                  <Stack direction="row" alignItems="center" spacing={0.8}>
                    <HomeWorkOutlinedIcon sx={{ color: brand.magenta[500], fontSize: 18 }} />
                    <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 900 }}>
                      {t('visitProperty')}
                    </Typography>
                  </Stack>
                  <Typography
                    sx={{ color: brand.graphite[500], fontSize: 18, fontWeight: 900, mt: 0.8 }}
                  >
                    {property.title}
                  </Typography>
                  <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 700 }}>
                    {property.address}
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.2 }}>
                    {[property.price, property.area, property.bedrooms].map((item) => (
                      <Chip
                        key={item}
                        label={item}
                        size="small"
                        sx={{
                          bgcolor: surface.app,
                          color: brand.graphite[500],
                          fontSize: 11,
                          fontWeight: 900,
                        }}
                      />
                    ))}
                  </Stack>
                  <Typography
                    sx={{ color: brand.graphite[500], fontSize: 13, fontWeight: 700, mt: 1.2 }}
                  >
                    {property.summary}
                  </Typography>
                </Box>
              </Box>
            ) : null}
          </DialogContent>
        </>
      ) : null}
    </Dialog>
  )
}
