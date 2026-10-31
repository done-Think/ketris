import type { MapLocation, SearchMapCamera } from '../types/map-location'

export const defaultSearchMapView = { latitude: -15, longitude: -52, zoom: 3 }

export function isValidMapLocation(location: MapLocation): boolean {
  return (
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude) &&
    Math.abs(location.latitude) <= 90 &&
    Math.abs(location.longitude) <= 180
  )
}

export function getSearchMapCamera(
  points: MapLocation[],
  viewerLocation?: MapLocation,
): SearchMapCamera {
  if (viewerLocation && isValidMapLocation(viewerLocation)) {
    return { center: [viewerLocation.longitude, viewerLocation.latitude], zoom: 11 }
  }
  const valid = points.filter(isValidMapLocation)
  if (!valid.length)
    return {
      center: [defaultSearchMapView.longitude, defaultSearchMapView.latitude],
      zoom: defaultSearchMapView.zoom,
    }
  return {
    bounds: [
      [Math.min(...valid.map((p) => p.longitude)), Math.min(...valid.map((p) => p.latitude))],
      [Math.max(...valid.map((p) => p.longitude)), Math.max(...valid.map((p) => p.latitude))],
    ],
  }
}
