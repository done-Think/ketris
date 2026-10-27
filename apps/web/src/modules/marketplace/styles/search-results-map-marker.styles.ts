import type { CSSProperties } from 'react'

export function getMapMarkerStyle(selected: boolean): CSSProperties {
  return { zIndex: selected ? 2 : 1 }
}
