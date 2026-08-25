'use client'

import { useRef, useState } from 'react'

import { HomeHeader, ProfileModal } from '@shared/components/layout'

import { getMarketplaceNavigationItems } from '../config/navigation'
import { profileActions, userProfile } from '../data/user-profile'
import type { MarketplaceHeaderProps } from '../types/marketplace-header'

export function MarketplaceHeader({ activeItemId }: MarketplaceHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileButtonRef = useRef<HTMLButtonElement | null>(null)
  const navigationItems = getMarketplaceNavigationItems(activeItemId)

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
        actions={profileActions}
        userProfile={userProfile}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  )
}
