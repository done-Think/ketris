import { describe, expect, it } from 'vitest'
import { getSearchMapCamera, isValidMapLocation } from '../../utils/search-map-camera'

describe('search map camera', () => {
  const itajuba = { latitude: -22.425, longitude: -45.453 }
  const pousoAlegre = { latitude: -22.23, longitude: -45.935 }

  it('uses the viewer region when no property has coordinates', () => {
    expect(getSearchMapCamera([], itajuba)).toEqual({
      center: [-45.453, -22.425],
      zoom: 14,
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
  it('automatically includes all found properties even when one is beyond five kilometers from the viewer', () => {
    expect(getSearchMapCamera([itajuba, pousoAlegre], itajuba)).toEqual({
      bounds: [
        [-45.935, -22.425],
        [-45.453, -22.23],
      ],
    })
  })
  it('includes the viewer region and a property in another city without depending on a viewer marker', () => {
    expect(getSearchMapCamera([pousoAlegre], itajuba)).toEqual({
      bounds: [
        [-45.935, -22.425],
        [-45.453, -22.23],
      ],
    })
  })
  it('falls back safely when result coordinates and the viewer position are invalid', () => {
    expect(
      getSearchMapCamera([{ latitude: NaN, longitude: 0 }], { latitude: 91, longitude: 0 }),
    ).toEqual({ center: [-52, -15], zoom: 3 })
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
      center: [0, 0],
      zoom: 15,
    })
    expect(isValidMapLocation({ latitude: 91, longitude: 0 })).toBe(false)
  })
})
