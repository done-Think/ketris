'use client'

import { useMemo, useRef, useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { HomeHeader, ProfileModal } from '@shared/components/layout'

import { profileActions } from '../data/user-profile'
import { useMarketplaceNavigation } from '../hooks/use-marketplace-navigation'
import type { MarketplaceHeaderProps } from '../types/marketplace-header'

export function MarketplaceHeader({ activeItemId }: MarketplaceHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileButtonRef = useRef<HTMLButtonElement | null>(null)
  const tProfileActions = useTranslations('marketplace.profile.actions')
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
        }
      : undefined

  const translatedProfileActions = useMemo(
    () =>
      profileActions.map((action) => ({
        ...action,
        label: tProfileActions(action.labelKey),
        onClick: action.labelKey === 'signOut' ? () => signOut() : undefined,
      })),
    [tProfileActions],
  )

  return (
    <>
      <HomeHeader
        navigationItems={navigationItems}
        profileButtonRef={profileButtonRef}
        userProfile={userProfile}
        onToggleProfile={userProfile ? () => setIsProfileOpen((current) => !current) : undefined}
      />

      {userProfile ? (
        <ProfileModal
          open={isProfileOpen}
          anchorRef={profileButtonRef}
          actions={translatedProfileActions}
          userProfile={userProfile}
          onClose={() => setIsProfileOpen(false)}
        />
      ) : null}
    </>
  )
}
