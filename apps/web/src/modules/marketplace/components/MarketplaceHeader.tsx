'use client'

import { useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

import { getLocalizedPathname } from '@/i18n/locale-prefix'
import { HomeHeader, ProfileModal } from '@shared/components/layout'
import { clearClientSession } from '@shared/lib/auth/clear-client-session'

import { guestProfileActions, profileActions } from '../data/user-profile'
import { useMarketplaceNavigation } from '../hooks/use-marketplace-navigation'
import type { MarketplaceHeaderProps } from '../types/marketplace-header'

export function MarketplaceHeader({ activeItemId }: MarketplaceHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileButtonRef = useRef<HTMLButtonElement | null>(null)
  const tProfileActions = useTranslations('marketplace.profile.actions')
  const tProfile = useTranslations('marketplace.profile')
  const locale = useLocale()
  const router = useRouter()
  const { data: session, status } = useSession()
  const { homeNavigationItems } = useMarketplaceNavigation()
  const navigationItems = homeNavigationItems.map((item) => ({
    ...item,
    active: item.id === activeItemId,
  }))

  const userProfile =
    status === 'authenticated' && session?.user
      ? {
          name: session.user.name ?? session.user.email ?? '',
          email: session.user.email ?? '',
          avatar: session.user.image ?? undefined,
          role: session.papel,
        }
      : undefined
  const isGuest = status === 'unauthenticated'
  const menuProfile =
    userProfile ??
    (isGuest
      ? {
          name: tProfile('guestName'),
          email: '',
        }
      : undefined)

  const translatedProfileActions = useMemo(
    () =>
      (userProfile ? profileActions : guestProfileActions).map((action) => ({
        ...action,
        label: tProfileActions(action.labelKey),
        onClick:
          action.labelKey === 'signOut'
            ? async () => {
                await clearClientSession()
                router.replace(getLocalizedPathname('/', locale))
                router.refresh()
              }
            : undefined,
      })),
    [locale, router, tProfileActions, userProfile],
  )

  return (
    <>
      <HomeHeader
        navigationItems={navigationItems}
        profileButtonRef={profileButtonRef}
        userProfile={menuProfile}
        onToggleProfile={menuProfile ? () => setIsProfileOpen((current) => !current) : undefined}
        isSessionLoading={status === 'loading'}
        showSignIn={isGuest}
        showLanguageSelector={isGuest}
      />

      {menuProfile ? (
        <ProfileModal
          open={isProfileOpen}
          anchorRef={profileButtonRef}
          actions={translatedProfileActions}
          userProfile={menuProfile}
          onClose={() => setIsProfileOpen(false)}
        />
      ) : null}
    </>
  )
}
