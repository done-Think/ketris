'use client'

import { useMemo } from 'react'
import { Box } from '@mui/material'
import { useTranslations } from 'next-intl'
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre'

import { Link } from '@/i18n/navigation'
import { env } from '@config/env'

import type { SearchResultsMapProps } from '../types/search'
import { buildPropertyDetailHref } from '../utils/property-links'
import { getMapMarkerStyle } from '../styles/search-results-map-marker.styles'
import { styles, getBoxStyles } from '../styles/search-results-map.styles'

const defaultMapStyleUrl = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
const mapContainerStyle = { width: '100%', height: '100%' } as const

function getMapMarkerLabel(price: string) {
  return price.replace(/\s*\/\s*[^/]+$/, '')
}

export function SearchResultsMap({
  properties,
  selectedPropertyId,
  onSelectProperty,
}: SearchResultsMapProps) {
  const t = useTranslations('marketplace.searchResults.map')
  const mapStyleUrl =
    env.mapStyleUrl && !env.mapStyleUrl.includes('demotiles') ? env.mapStyleUrl : defaultMapStyleUrl
  const orderedProperties = useMemo(
    () => [
      ...properties.filter((property) => property.id !== selectedPropertyId),
      ...properties.filter((property) => property.id === selectedPropertyId),
    ],
    [properties, selectedPropertyId],
  )

  return (
    <Box sx={styles.box}>
      <Map
        locale={{
          'Map.Title': t('title'),
          'NavigationControl.ZoomIn': t('zoomIn'),
          'NavigationControl.ZoomOut': t('zoomOut'),
          'AttributionControl.ToggleAttribution': t('attribution'),
        }}
        initialViewState={{
          latitude: -23.5617,
          longitude: -46.6559,
          zoom: 12,
        }}
        mapStyle={mapStyleUrl}
        style={mapContainerStyle}
        attributionControl={true}
      >
        {orderedProperties
          .filter((property) => property.mapCenter)
          .map((property) => {
            const selected = property.id === selectedPropertyId
            const detailsHref = buildPropertyDetailHref(property.href, property.purpose)
            const mapCenter = property.mapCenter!

            return (
              <Marker
                key={property.id}
                latitude={mapCenter.latitude}
                longitude={mapCenter.longitude}
                anchor="bottom"
                style={getMapMarkerStyle(selected)}
              >
                <Box
                  component={Link}
                  href={detailsHref}
                  aria-label={t('openProperty', { title: property.title })}
                  onClick={() => onSelectProperty(property.id)}
                  onFocus={() => onSelectProperty(property.id)}
                  onMouseEnter={() => onSelectProperty(property.id)}
                  sx={getBoxStyles({ selected })}
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
