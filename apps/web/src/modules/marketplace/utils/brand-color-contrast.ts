import { surface } from '@shared/theme/tokens'

import type {
  AgencyBrandColorField,
  AgencyBrandContrastIssue,
  AgencyBrandFormValues,
} from '../types/agency-brand-editor'

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/
const MIN_READABLE_RATIO = 3

function toLinearChannel(channel: number) {
  const value = channel / 255
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

export function isHexColor(value: string) {
  return HEX_COLOR_PATTERN.test(value)
}

export function relativeLuminance(hex: string) {
  const [red, green, blue] = [1, 3, 5].map((start) =>
    toLinearChannel(parseInt(hex.slice(start, start + 2), 16)),
  )
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

export function contrastRatio(first: string, second: string) {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort(
    (a, b) => b - a,
  )
  return (lighter + 0.05) / (darker + 0.05)
}

export function findBrandContrastIssues(
  values: Pick<AgencyBrandFormValues, AgencyBrandColorField>,
): AgencyBrandContrastIssue[] {
  const issues: AgencyBrandContrastIssue[] = []
  const nameColor = values.secondaryColor || values.primaryColor

  if (isHexColor(values.backgroundColor) && isHexColor(nameColor)) {
    const ratio = contrastRatio(values.backgroundColor, nameColor)
    if (ratio < MIN_READABLE_RATIO) {
      issues.push({
        kind: 'nameOnBackground',
        ratio,
        suggestion: relativeLuminance(values.backgroundColor) > 0.5 ? 'darker' : 'lighter',
      })
    }
  }

  if (isHexColor(values.primaryColor)) {
    const ratio = contrastRatio(values.primaryColor, surface.paper)
    if (ratio < MIN_READABLE_RATIO)
      issues.push({ kind: 'textOnPrimary', ratio, suggestion: 'darker' })
  }

  return issues
}
