import { describe, expect, it } from 'vitest'
import { getSearchMapCamera, isValidMapLocation } from '../../utils/search-map-camera'

describe('search map camera', () => {
  const itajuba = { latitude: -22.425, longitude: -45.453 }
  const pousoAlegre = { latitude: -22.23, longitude: -45.935 }

  it('centers on the viewer instead of a fixed city', () => {
    expect(getSearchMapCamera([pousoAlegre], itajuba)).toEqual({
      center: [-45.453, -22.425],
      zoom: 11,
    })
  })
  it('fits all geocoded results when location is unavailable', () => {
    expect(getSearchMapCamera([itajuba, pousoAlegre])).toEqual({
      bounds: [
        [-45.935, -22.425],
        [-45.453, -22.23],
      ],
    })
  })
  it('uses a country view without inventing a property location', () => {
    expect(getSearchMapCamera([])).toEqual({ center: [-52, -15], zoom: 3 })
  })
  it('accepts zero coordinates and ignores invalid points', () => {
    expect(
      getSearchMapCamera([
        { latitude: NaN, longitude: 0 },
        { latitude: 0, longitude: 0 },
      ]),
    ).toEqual({
      bounds: [
        [0, 0],
        [0, 0],
      ],
    })
    expect(isValidMapLocation({ latitude: 91, longitude: 0 })).toBe(false)
  })
})
