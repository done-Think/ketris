'use client'

import { useQuery } from '@tanstack/react-query'
import { marketplaceQueryKeys } from '../config/marketplace-query-keys'
import type { MapLocation } from '../types/map-location'
import { isValidMapLocation } from '../utils/search-map-camera'

function getBrowserLocation(): Promise<MapLocation> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation unavailable'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const location = { latitude: coords.latitude, longitude: coords.longitude }
        if (isValidMapLocation(location)) resolve(location)
        else reject(new Error('Invalid geolocation'))
      },
      () => reject(new Error('Geolocation unavailable')),
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 300000,
      },
    )
  })
}

export function useBrowserLocation(enabled = true) {
  return useQuery({
    queryKey: marketplaceQueryKeys.viewerLocation(),
    queryFn: getBrowserLocation,
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: false,
    retryOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
