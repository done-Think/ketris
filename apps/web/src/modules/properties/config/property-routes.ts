import type { PropertyRoute } from '../types/dashboard-property'

export const propertyRoutes = {
  list: '/dashboard/properties',
  create: '/dashboard/properties/new',
} as const satisfies Record<string, PropertyRoute>

export function getPropertyDetailRoute(propertyId: string) {
  return `${propertyRoutes.list}/${propertyId}`
}
