import { describe, expect, it } from 'vitest'
import { getSearchMapCamera, isValidMapLocation } from '../../utils/search-map-camera'

describe('search map camera', () => {
  const itajuba = { latitude: -22.425, longitude: -45.453 }
  const pousoAlegre = { latitude: -22.23, longitude: -45.935 }

  it('centers on the viewer instead of a fixed city', () => {
    expect(getSearchMapCamera([pousoAlegre], itajuba)).toEqual({
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
  it('keeps nearby prices visible around the viewer without zooming out to a distant city', () => {
    const nearby = { latitude: itajuba.latitude + 0.01, longitude: itajuba.longitude + 0.01 }
    const camera = getSearchMapCamera([nearby, pousoAlegre], itajuba)
    expect('bounds' in camera).toBe(true)
    if ('bounds' in camera) {
      expect(camera.bounds[0][0]).toBeCloseTo(itajuba.longitude - 0.01)
      expect(camera.bounds[1][0]).toBeCloseTo(nearby.longitude)
      expect(camera.bounds[0][1]).toBeCloseTo(itajuba.latitude - 0.01)
      expect(camera.bounds[1][1]).toBeCloseTo(nearby.latitude)
    }
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
