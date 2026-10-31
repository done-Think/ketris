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
  const valid = points.filter(isValidMapLocation)
  // Location guides the search; the camera must include every geocoded result on the current page.
  if (!valid.length && viewerLocation && isValidMapLocation(viewerLocation))
    return { center: [viewerLocation.longitude, viewerLocation.latitude], zoom: 14 }
  if (!valid.length)
    return {
      center: [defaultSearchMapView.longitude, defaultSearchMapView.latitude],
      zoom: defaultSearchMapView.zoom,
    }
  const frame =
    viewerLocation && isValidMapLocation(viewerLocation) ? [...valid, viewerLocation] : valid
  if (
    frame.every(
      (point) => point.latitude === frame[0].latitude && point.longitude === frame[0].longitude,
    )
  )
    return { center: [frame[0].longitude, frame[0].latitude], zoom: 15 }
  return {
    bounds: [
      [Math.min(...frame.map((p) => p.longitude)), Math.min(...frame.map((p) => p.latitude))],
      [Math.max(...frame.map((p) => p.longitude)), Math.max(...frame.map((p) => p.latitude))],
    ],
  }
}
