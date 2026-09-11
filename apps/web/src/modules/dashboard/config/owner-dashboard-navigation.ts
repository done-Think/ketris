import type { OwnerNavigationItem } from '../types/owner-dashboard'

export const ownerDashboardNavigationItems: OwnerNavigationItem[] = [
  { id: 'panel', label: 'Painel', href: '/dashboard', exact: true },
  { id: 'properties', label: 'Meus Imóveis', href: '/dashboard/properties' },
  { id: 'proposals', label: 'Propostas', href: '/dashboard/proposals' },
  { id: 'visits', label: 'Visitas', href: '/dashboard/agenda' },
  { id: 'financial', label: 'Financeiro', href: '/dashboard/finance' },
  { id: 'documents', label: 'Documentos', disabled: true },
]

export function isOwnerNavigationItemActive(pathname: string, item: OwnerNavigationItem) {
  if (!item.href || item.disabled) return false
  if (item.exact) return pathname === item.href

  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}
