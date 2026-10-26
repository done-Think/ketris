import type {
  DashboardActivityProperty,
  DashboardActivityPropertySource,
} from '../types/dashboard-overview'

export function toVisibleActivityProperty(
  source: DashboardActivityPropertySource | null,
): DashboardActivityProperty | null {
  if (!source || source.status !== 'PUBLISHED') return null

  return {
    id: source.id,
    title: source.title,
    price: source.price,
    address: source.address,
  }
}
