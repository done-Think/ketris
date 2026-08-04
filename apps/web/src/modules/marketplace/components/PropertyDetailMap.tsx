'use client'

import { Box } from '@mui/material'
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre'

import { env } from '@config/env'
import { radius } from '@shared/theme/tokens'

const defaultMapStyleUrl = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

type PropertyDetailMapProps = {
  latitude: number
  longitude: number
}

export function PropertyDetailMap({ latitude, longitude }: PropertyDetailMapProps) {
  const mapStyleUrl =
    env.mapStyleUrl && !env.mapStyleUrl.includes('demotiles') ? env.mapStyleUrl : defaultMapStyleUrl

  return (
    <Box
      sx={{
        height: { xs: 240, md: 280 },
        overflow: 'hidden',
        borderRadius: `${radius.sm}px`,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Map
        initialViewState={{ latitude, longitude, zoom: 13.5 }}
        mapStyle={mapStyleUrl}
        style={{ width: '100%', height: '100%' }}
        attributionControl={true}
      >
        <Marker latitude={latitude} longitude={longitude} anchor="center">
          <Box
            sx={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              border: '4px solid',
              borderColor: 'common.white',
              boxShadow: '0 10px 24px rgba(243, 2, 116, 0.36)',
            }}
          />
        </Marker>
        <NavigationControl position="bottom-right" showCompass={false} />
      </Map>
    </Box>
  )
}
