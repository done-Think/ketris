'use client'

import { useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { useRouter } from '@/i18n/navigation'
import { HomeHeader, ProfileModal } from '@shared/components/layout'
import { clearClientSession } from '@shared/lib/auth/clear-client-session'
import type { LocalizedStringHref } from '@shared/types/localized-href'

import { profileActions } from '../config/profile-actions'
import { useMarketplaceNavigation } from '../hooks/use-marketplace-navigation'
import type { MarketplaceHeaderProps } from '../types/marketplace-header'
import type { ProfileActionTranslationKey } from '../types/user-profile'

function getSwitchModeAction(role: string | undefined): {
  href: LocalizedStringHref
  labelKey: ProfileActionTranslationKey
} | null {
  if (role === 'OWNER') {
    return null
  }

  if (role === 'AGENT') {
    return {
      href: '/register/details?profile=imobiliaria' as LocalizedStringHref,
      labelKey: 'createAgency',
    }
  }

  return {
    href: '/register/details?profile=corretor' as LocalizedStringHref,
    labelKey: 'becomeBroker',
  }
}

export function MarketplaceHeader({ activeItemId }: MarketplaceHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileButtonRef = useRef<HTMLButtonElement>(null)
  const tProfileActions = useTranslations('marketplace.profile.actions')
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
          role: session.role,
        }
      : undefined
  const isGuest = status === 'unauthenticated'
  const isAuthenticatedUser = Boolean(userProfile)

  const translatedProfileActions = useMemo(() => {
    if (!isAuthenticatedUser) return []

    return profileActions.flatMap((action) => {
      const switchModeAction =
        action.labelKey === 'switchMode' ? getSwitchModeAction(session?.role) : undefined

      if (switchModeAction === null) return []

      const labelKey = switchModeAction?.labelKey ?? action.labelKey

      return {
        ...action,
        href: switchModeAction?.href ?? action.href,
        label: tProfileActions(labelKey),
        onClick:
          action.labelKey === 'signOut'
            ? async () => {
                await clearClientSession()
                router.replace('/')
                router.refresh()
              }
            : undefined,
      }
    })
  }, [isAuthenticatedUser, router, session?.role, tProfileActions])

  return (
    <>
      <HomeHeader
        navigationItems={navigationItems}
        profileButtonRef={profileButtonRef}
        userProfile={userProfile}
        onToggleProfile={userProfile ? () => setIsProfileOpen((current) => !current) : undefined}
        isSessionLoading={status === 'loading'}
        showSignIn={isGuest}
        showLanguageSelector={isGuest}
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
