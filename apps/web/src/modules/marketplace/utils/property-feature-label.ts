import type {
  PropertyFeatureDetail,
  PropertyFeatureTranslation,
} from '../types/property-feature-label'

export function getPropertyFeatureLabel(
  detail: PropertyFeatureDetail,
  t: PropertyFeatureTranslation,
) {
  if (detail.value === undefined) return detail.label

  return t(`features.${detail.key}`, { count: detail.value })
}
