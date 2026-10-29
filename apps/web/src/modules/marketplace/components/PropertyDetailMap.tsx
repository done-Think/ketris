'use client'

import { Box } from '@mui/material'
import { useTranslations } from 'next-intl'
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre'

import { env } from '@config/env'

import type { PropertyDetailMapProps } from '../types/property-detail'
import { styles } from '../styles/property-detail-map.styles'

const defaultMapStyleUrl = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
const mapContainerStyle = { width: '100%', height: '100%' } as const

export function PropertyDetailMap({ latitude, longitude }: PropertyDetailMapProps) {
  const t = useTranslations('marketplace.searchResults.map')
  const mapStyleUrl =
    env.mapStyleUrl && !env.mapStyleUrl.includes('demotiles') ? env.mapStyleUrl : defaultMapStyleUrl

  return (
    <Box sx={styles.box}>
      <Map
        locale={{
          'Map.Title': t('title'),
          'NavigationControl.ZoomIn': t('zoomIn'),
          'NavigationControl.ZoomOut': t('zoomOut'),
          'AttributionControl.ToggleAttribution': t('attribution'),
        }}
        initialViewState={{ latitude, longitude, zoom: 13.5 }}
        mapStyle={mapStyleUrl}
        style={mapContainerStyle}
        attributionControl={true}
      >
        <Marker latitude={latitude} longitude={longitude} anchor="center">
          <Box sx={styles.box2} />
        </Marker>
        <NavigationControl position="bottom-right" showCompass={false} />
      </Map>
    </Box>
  )
}
