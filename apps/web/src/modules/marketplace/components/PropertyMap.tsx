'use client'

import { useEffect, useRef } from 'react'
import { Avatar, Box, Stack, Typography } from '@mui/material'
import Map, { Marker, NavigationControl, Popup, type MapRef } from 'react-map-gl/maplibre'

import type { MarketplaceProperty } from '../types/property'

type PropertyMapProps = {
  properties: MarketplaceProperty[]
  selectedProperty: MarketplaceProperty | null
  onSelect: (property: MarketplaceProperty | null) => void
}

const formatCompactPrice = (price: number) =>
  new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 1,
  }).format(price)

export function PropertyMap({ properties, selectedProperty, onSelect }: PropertyMapProps) {
  const mapRef = useRef<MapRef | null>(null)

  useEffect(() => {
    if (!mapRef.current || properties.length === 0) return

    if (properties.length === 1) {
      mapRef.current.flyTo({
        center: [properties[0].coordinates.longitude, properties[0].coordinates.latitude],
        zoom: 14,
        duration: 800,
      })
      return
    }

    const longitudes = properties.map((property) => property.coordinates.longitude)
    const latitudes = properties.map((property) => property.coordinates.latitude)

    mapRef.current.fitBounds(
      [
        [Math.min(...longitudes), Math.min(...latitudes)],
        [Math.max(...longitudes), Math.max(...latitudes)],
      ],
      { padding: 72, maxZoom: 12.5, duration: 800 },
    )
  }, [properties])

  useEffect(() => {
    if (!mapRef.current || !selectedProperty) return

    mapRef.current.flyTo({
      center: [selectedProperty.coordinates.longitude, selectedProperty.coordinates.latitude],
      zoom: Math.max(mapRef.current.getZoom(), 13),
      duration: 650,
    })
  }, [selectedProperty])

  return (
    <Box sx={{ width: '100%', height: '100%', minHeight: 440, position: 'relative' }}>
      <Map
        ref={mapRef}
        initialViewState={{ latitude: -23.568, longitude: -46.676, zoom: 11 }}
        mapStyle={
          process.env.NEXT_PUBLIC_MAP_STYLE_URL || 'https://demotiles.maplibre.org/style.json'
        }
        attributionControl
        style={{ width: '100%', height: '100%' }}
        onClick={() => onSelect(null)}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {properties.map((property) => {
          const active = property.id === selectedProperty?.id

          return (
            <Marker
              key={property.id}
              latitude={property.coordinates.latitude}
              longitude={property.coordinates.longitude}
              anchor="bottom"
              onClick={(event) => {
                event.originalEvent.stopPropagation()
                onSelect(property)
              }}
            >
              <Box
                component="button"
                type="button"
                aria-label={`${property.title}, ${formatCompactPrice(property.price)}`}
                sx={{
                  position: 'relative',
                  border: 0,
                  borderRadius: 999,
                  px: 1.35,
                  py: 0.7,
                  bgcolor: active ? '#F30274' : '#212631',
                  color: '#FFFFFF',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 11,
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: active
                    ? '0 8px 24px rgba(243,2,116,0.38)'
                    : '0 7px 20px rgba(33,38,49,0.28)',
                  transform: active ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 160ms ease, background-color 160ms ease',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    left: '50%',
                    bottom: -5,
                    width: 10,
                    height: 10,
                    bgcolor: active ? '#F30274' : '#212631',
                    transform: 'translateX(-50%) rotate(45deg)',
                    zIndex: -1,
                  },
                  '&:hover': { bgcolor: '#F30274', transform: 'scale(1.08)' },
                }}
              >
                {formatCompactPrice(property.price)}
              </Box>
            </Marker>
          )
        })}

        {selectedProperty && (
          <Popup
            latitude={selectedProperty.coordinates.latitude}
            longitude={selectedProperty.coordinates.longitude}
            offset={32}
            closeButton={false}
            closeOnClick={false}
            onClose={() => onSelect(null)}
            maxWidth="260px"
          >
            <Box sx={{ width: 230 }}>
              <Box
                component="img"
                src={selectedProperty.image}
                alt=""
                sx={{ width: '100%', height: 104, display: 'block', objectFit: 'cover' }}
              />
              <Box sx={{ p: 1.4 }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 900, lineHeight: 1.3 }}>
                  {selectedProperty.title}
                </Typography>
                <Typography color="primary" sx={{ fontSize: 14, fontWeight: 900, mt: 0.5 }}>
                  {formatCompactPrice(selectedProperty.price)} / mês
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.7} sx={{ mt: 1 }}>
                  <Avatar
                    src={selectedProperty.avatar}
                    alt={selectedProperty.broker}
                    sx={{ width: 24, height: 24 }}
                  />
                  <Typography color="text.secondary" sx={{ fontSize: 10.5 }}>
                    {selectedProperty.broker}
                  </Typography>
                </Stack>
              </Box>
            </Box>
          </Popup>
        )}
      </Map>

      <Box
        sx={{
          position: 'absolute',
          left: 14,
          bottom: 14,
          zIndex: 2,
          bgcolor: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(10px)',
          borderRadius: 1.5,
          px: 1.3,
          py: 0.75,
          boxShadow: '0 8px 24px rgba(33,38,49,0.12)',
        }}
      >
        <Typography sx={{ fontSize: 10.5, fontWeight: 800 }}>
          {properties.length} {properties.length === 1 ? 'imóvel no mapa' : 'imóveis no mapa'}
        </Typography>
      </Box>
    </Box>
  )
}
