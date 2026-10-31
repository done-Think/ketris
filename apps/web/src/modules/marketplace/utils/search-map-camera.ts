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
  if (viewerLocation && isValidMapLocation(viewerLocation)) {
    const nearby = valid.filter(
      (point) =>
        Math.hypot(
          point.latitude - viewerLocation.latitude,
          (point.longitude - viewerLocation.longitude) *
            Math.cos((viewerLocation.latitude * Math.PI) / 180),
        ) *
          111 <=
        5,
    )
    const latitudeSpan = Math.max(
      0,
      ...nearby.map((point) => Math.abs(point.latitude - viewerLocation.latitude)),
    )
    const longitudeSpan = Math.max(
      0,
      ...nearby.map((point) => Math.abs(point.longitude - viewerLocation.longitude)),
    )
    // Keep the viewer centered while including nearby prices. Distant cities remain accessible via Show results.
    if (latitudeSpan > 0 || longitudeSpan > 0)
      return {
        bounds: [
          [viewerLocation.longitude - longitudeSpan, viewerLocation.latitude - latitudeSpan],
          [viewerLocation.longitude + longitudeSpan, viewerLocation.latitude + latitudeSpan],
        ],
      }
    return { center: [viewerLocation.longitude, viewerLocation.latitude], zoom: 14 }
  }
  if (!valid.length)
    return {
      center: [defaultSearchMapView.longitude, defaultSearchMapView.latitude],
      zoom: defaultSearchMapView.zoom,
    }
  if (
    valid.every(
      (point) => point.latitude === valid[0].latitude && point.longitude === valid[0].longitude,
    )
  )
    return { center: [valid[0].longitude, valid[0].latitude], zoom: 15 }
  return {
    bounds: [
      [Math.min(...valid.map((p) => p.longitude)), Math.min(...valid.map((p) => p.latitude))],
      [Math.max(...valid.map((p) => p.longitude)), Math.max(...valid.map((p) => p.latitude))],
    ],
  }
}
