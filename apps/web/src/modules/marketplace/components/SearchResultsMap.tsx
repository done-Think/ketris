'use client'

import { Box } from '@mui/material'
import Link from 'next/link'
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre'

import { env } from '@config/env'
import { componentText, motion, radius, shadows, surface } from '@shared/theme/tokens'

import type { MarketplacePropertyDetail } from '../data/property-details'

const defaultMapStyleUrl = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

type SearchResultsMapProps = {
  properties: MarketplacePropertyDetail[]
  selectedPropertyId: string
  onSelectProperty: (propertyId: string) => void
}

function getMapMarkerLabel(price: string) {
  return price.replace(' / mês', '')
}

export function SearchResultsMap({
  properties,
  selectedPropertyId,
  onSelectProperty,
}: SearchResultsMapProps) {
  const mapStyleUrl =
    env.mapStyleUrl && !env.mapStyleUrl.includes('demotiles') ? env.mapStyleUrl : defaultMapStyleUrl

  return (
    <Box
      sx={{
        height: { xs: 360, lg: '100%' },
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: `${radius.sm}px`,
        bgcolor: surface.darkDeep,
      }}
    >
      <Map
        initialViewState={{
          latitude: -23.5617,
          longitude: -46.6559,
          zoom: 12,
        }}
        mapStyle={mapStyleUrl}
        style={{ width: '100%', height: '100%' }}
        attributionControl={true}
      >
        {properties.map((property) => {
          const selected = property.id === selectedPropertyId

          return (
            <Marker
              key={property.id}
              latitude={property.mapCenter.latitude}
              longitude={property.mapCenter.longitude}
              anchor="bottom"
            >
              <Box
                component={Link}
                href={property.href}
                aria-label={`Abrir ${property.title}`}
                onClick={() => onSelectProperty(property.id)}
                onFocus={() => onSelectProperty(property.id)}
                onMouseEnter={() => onSelectProperty(property.id)}
                sx={{
                  minWidth: selected ? 104 : 86,
                  height: selected ? 34 : 30,
                  px: 1.2,
                  border: '1px solid',
                  borderColor: selected ? 'primary.main' : 'divider',
                  borderRadius: radius.full,
                  bgcolor: selected ? 'primary.main' : surface.paper,
                  boxShadow: selected ? shadows.propertyCardHover : shadows.propertyCard,
                  color: selected ? surface.lightText : 'primary.main',
                  cursor: 'pointer',
                  display: 'inline-grid',
                  placeItems: 'center',
                  textDecoration: 'none',
                  ...componentText.resetButtonText,
                  fontSize: selected ? 13 : 12,
                  fontWeight: 900,
                  transition: motion.transition.card,
                  transform: selected ? 'translateY(-2px)' : 'none',
                  '&:hover': {
                    boxShadow: shadows.propertyCardHover,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                {getMapMarkerLabel(property.price)}
              </Box>
            </Marker>
          )
        })}
        <NavigationControl position="bottom-right" showCompass={false} />
      </Map>
    </Box>
  )
}
