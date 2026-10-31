'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Typography } from '@mui/material'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import { useTranslations } from 'next-intl'
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre'
import type { MapRef } from 'react-map-gl/maplibre'

import { Link } from '@/i18n/navigation'
import { env } from '@config/env'

import type { SearchResultsMapProps } from '../types/search'
import { buildPropertyDetailHref } from '../utils/property-links'
import { getMapMarkerStyle } from '../styles/search-results-map-marker.styles'
import { styles, getBoxStyles } from '../styles/search-results-map.styles'
import {
  defaultSearchMapView,
  getSearchMapCamera,
  isValidMapLocation,
} from '../utils/search-map-camera'
import type { SearchMapCamera } from '../types/map-location'

const defaultMapStyleUrl = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
const mapContainerStyle = { width: '100%', height: '100%' } as const

function getMapMarkerLabel(price: string) {
  return price.replace(/\s*\/\s*[^/]+$/, '')
}

function applyCamera(map: MapRef | null, camera: SearchMapCamera) {
  if ('bounds' in camera) map?.fitBounds(camera.bounds, { padding: 60, maxZoom: 15, duration: 0 })
  else map?.easeTo({ center: camera.center, zoom: camera.zoom, duration: 0 })
}

export function SearchResultsMap({
  properties,
  selectedPropertyId,
  onSelectProperty,
  viewerLocation,
  locationUpdatedAt,
}: SearchResultsMapProps) {
  const t = useTranslations('marketplace.searchResults.map')
  const mapRef = useRef<MapRef>(null)
  const [ready, setReady] = useState(false)
  const points = properties.flatMap(({ mapCenter }) =>
    mapCenter && isValidMapLocation(mapCenter) ? [mapCenter] : [],
  )
  const cameraKey = JSON.stringify(getSearchMapCamera(points, viewerLocation))

  useEffect(() => {
    if (ready) applyCamera(mapRef.current, JSON.parse(cameraKey) as SearchMapCamera)
  }, [ready, cameraKey, locationUpdatedAt])
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
        ref={mapRef}
        onLoad={() => setReady(true)}
        locale={{
          'Map.Title': t('title'),
          'NavigationControl.ZoomIn': t('zoomIn'),
          'NavigationControl.ZoomOut': t('zoomOut'),
          'AttributionControl.ToggleAttribution': t('attribution'),
        }}
        initialViewState={defaultSearchMapView}
        mapStyle={mapStyleUrl}
        style={mapContainerStyle}
        attributionControl={true}
      >
        {orderedProperties
          .filter((property) => property.mapCenter && isValidMapLocation(property.mapCenter))
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
                  title={t('approximateLocation')}
                  data-property-id={property.id}
                  data-highlighted={selected}
                  onClick={() => onSelectProperty(property.id)}
                  onFocus={() => onSelectProperty(property.id)}
                  onMouseEnter={() => onSelectProperty(property.id)}
                  sx={getBoxStyles({ selected })}
                >
                  <HomeOutlinedIcon sx={styles.propertyIcon} />
                  {getMapMarkerLabel(property.price)}
                </Box>
              </Marker>
            )
          })}
        <NavigationControl position="bottom-right" showCompass={false} />
      </Map>
      {points.length < properties.length ? (
        <Typography role="status" sx={styles.locationNotice}>
          {t('unlocatedProperties')}
        </Typography>
      ) : null}
    </Box>
  )
}
