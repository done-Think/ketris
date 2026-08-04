'use client'

import { Box } from '@mui/material'
import Map, { NavigationControl } from 'react-map-gl/maplibre'

import { env } from '@config/env'
import { radius, surface } from '@shared/theme/tokens'

const defaultMapStyleUrl = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

export function SearchResultsMap() {
  const mapStyleUrl =
    env.mapStyleUrl && !env.mapStyleUrl.includes('demotiles') ? env.mapStyleUrl : defaultMapStyleUrl

  return (
    <Box
      sx={{
        position: { lg: 'sticky' },
        top: { lg: 60 },
        height: { xs: 360, lg: 'calc(100vh - 60px)' },
        minHeight: { lg: 620 },
        overflow: 'hidden',
        borderRadius: { xs: `${radius.sm}px`, lg: 0 },
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
        attributionControl={false}
      >
        <NavigationControl position="bottom-right" showCompass={false} />
      </Map>
    </Box>
  )
}
