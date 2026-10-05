'use client'

import { useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

import { getLocalizedPathname } from '@/i18n/locale-prefix'
import { HomeHeader, ProfileModal } from '@shared/components/layout'
import { clearClientSession } from '@shared/lib/auth/clear-client-session'
import type { LocalizedStringHref } from '@shared/types/localized-href'

import { profileActions } from '../data/user-profile'
import { useMarketplaceNavigation } from '../hooks/use-marketplace-navigation'
import type { MarketplaceHeaderProps } from '../types/marketplace-header'
import type { ProfileActionTranslationKey } from '../types/user-profile'

function getSwitchModeAction(papel: string | undefined): {
  href: LocalizedStringHref
  labelKey: ProfileActionTranslationKey
} | null {
  if (papel === 'ADMIN' || papel === 'OWNER') {
    return null
  }

  if (papel === 'AGENT') {
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
  const profileButtonRef = useRef<HTMLButtonElement | null>(null)
  const tProfileActions = useTranslations('marketplace.profile.actions')
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

  const translatedProfileActions = useMemo(
    () =>
      profileActions.flatMap((action) => {
        const switchModeAction =
          action.labelKey === 'switchMode' ? getSwitchModeAction(session?.papel) : undefined

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
                  router.replace(getLocalizedPathname('/', locale))
                  router.refresh()
                }
              : undefined,
        }
      }),
    [locale, router, session?.papel, tProfileActions],
  )

  return (
    <>
      <HomeHeader
        navigationItems={navigationItems}
        profileButtonRef={profileButtonRef}
        userProfile={userProfile}
        onToggleProfile={userProfile ? () => setIsProfileOpen((current) => !current) : undefined}
        isSessionLoading={status === 'loading'}
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
