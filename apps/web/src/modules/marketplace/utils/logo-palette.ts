import { brand, surface } from '@shared/theme/tokens'

import type { AgencyBrandSuggestedPalette, LogoColorSample } from '../types/agency-brand-editor'
import { contrastRatio } from './brand-color-contrast'

const SAMPLE_SIZE = 48
const MIN_ALPHA = 128
const MIN_READABLE_RATIO = 3

function toHex(channels: number[]) {
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

export function sampleLogoColors(pixels: Uint8ClampedArray): LogoColorSample[] {
  const buckets = new Map<string, { count: number; red: number; green: number; blue: number }>()

  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] < MIN_ALPHA) continue
    const [red, green, blue] = [pixels[index], pixels[index + 1], pixels[index + 2]]
    const key = `${red >> 4}-${green >> 4}-${blue >> 4}`
    const bucket = buckets.get(key) ?? { count: 0, red: 0, green: 0, blue: 0 }
    bucket.count += 1
    bucket.red += red
    bucket.green += green
    bucket.blue += blue
    buckets.set(key, bucket)
  }

  return [...buckets.values()].map((bucket) => {
    const channels = [bucket.red, bucket.green, bucket.blue].map((sum) =>
      Math.round(sum / bucket.count),
    )
    const max = Math.max(...channels)
    const min = Math.min(...channels)
    return {
      count: bucket.count,
      hex: toHex(channels),
      saturation: max === 0 ? 0 : (max - min) / max,
      lightness: (max + min) / 510,
    }
  })
}

export function suggestPaletteFromLogoColors(
  samples: LogoColorSample[],
): AgencyBrandSuggestedPalette | null {
  const readableOnWhite = (sample: LogoColorSample) =>
    contrastRatio(sample.hex, surface.paper) >= MIN_READABLE_RATIO
  const vivid = samples
    .filter((sample) => sample.saturation > 0.35 && sample.lightness > 0.15)
    .filter(readableOnWhite)
    .sort((first, second) => second.count * second.saturation - first.count * first.saturation)
  const dark = samples
    .filter((sample) => sample.lightness < 0.3)
    .sort((first, second) => second.count - first.count)
  const accent = vivid[0] ?? dark[0]

  if (!accent) return null

  const name = dark.find((sample) => sample.hex !== accent.hex)

  return {
    backgroundColor: surface.paper,
    primaryColor: accent.hex,
    secondaryColor: name?.hex ?? brand.graphite[500],
  }
}

export function extractLogoPalette(url: string): Promise<AgencyBrandSuggestedPalette | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = SAMPLE_SIZE
      canvas.height = SAMPLE_SIZE
      const context = canvas.getContext('2d')
      if (!context) return resolve(null)
      context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
      try {
        const { data } = context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
        resolve(suggestPaletteFromLogoColors(sampleLogoColors(data)))
      } catch {
        resolve(null)
      }
    }
    image.onerror = () => resolve(null)
    image.src = url
  })
}
