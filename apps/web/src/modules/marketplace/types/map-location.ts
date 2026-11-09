export type MapLocation = { latitude: number; longitude: number }

export type SearchMapCamera =
  { center: [number, number]; zoom: number } | { bounds: [[number, number], [number, number]] }
