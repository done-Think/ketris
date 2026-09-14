'use client'

import { useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

import { HomeHeader, ProfileModal } from '@shared/components/layout'

import { profileActions, userProfile } from '../data/user-profile'
import { useMarketplaceNavigation } from '../hooks/use-marketplace-navigation'
import type { MarketplaceHeaderProps } from '../types/marketplace-header'

export function MarketplaceHeader({ activeItemId }: MarketplaceHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileButtonRef = useRef<HTMLButtonElement | null>(null)
  const tProfileActions = useTranslations('marketplace.profile.actions')
  const { homeNavigationItems } = useMarketplaceNavigation()
  const navigationItems = homeNavigationItems.map((item) => ({
    ...item,
    active: item.id === activeItemId,
  }))
  const translatedProfileActions = useMemo(
    () =>
      profileActions.map((action) => ({
        ...action,
        label: tProfileActions(action.labelKey),
      })),
    [tProfileActions],
  )

  return (
    <>
      <HomeHeader
        navigationItems={navigationItems}
        profileButtonRef={profileButtonRef}
        userProfile={userProfile}
        onToggleProfile={() => setIsProfileOpen((current) => !current)}
      />

      <ProfileModal
        open={isProfileOpen}
        anchorRef={profileButtonRef}
        actions={translatedProfileActions}
        userProfile={userProfile}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  )
}
