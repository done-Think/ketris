import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'

import { redirect } from '@/i18n/navigation'

import { authOptions } from '@shared/lib/auth/auth-options'
import {
  canAccessFeature,
  homeHrefFor,
  resolveAccessProfile,
  type DashboardFeature,
} from '@shared/lib/auth/access-policy'

/**
 * Server-side route guard. Call it from a layout or page so a profile that should not see a
 * screen never receives it, even when the address is typed by hand.
 */
export async function requireDashboardFeature(feature: DashboardFeature): Promise<void> {
  const session = await getServerSession(authOptions)
  // The dashboard layout already handles unauthenticated and auth-unavailable states.
  if (!session || session.scope !== 'tenant' || session.authUnavailable) return
  if (!canAccessFeature(resolveAccessProfile(session.role, session.accountType), feature))
    notFound()
}

/**
 * Landing route after login: profiles without an overview go to their first allowed screen
 * instead of a 404.
 */
export async function requireDashboardHome(): Promise<void> {
  const session = await getServerSession(authOptions)
  if (!session || session.scope !== 'tenant' || session.authUnavailable) return
  const profile = resolveAccessProfile(session.role, session.accountType)
  if (canAccessFeature(profile, 'dashboard')) return
  const home = homeHrefFor(profile)
  if (home) redirect({ href: home as '/dashboard', locale: await getLocale() })
  notFound()
}
