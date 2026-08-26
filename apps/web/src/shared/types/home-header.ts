import type { RefObject } from 'react'
import type { LocalizedHref } from './localized-href'

export type HomeHeaderNavigationItem = {
  label: string
  href: LocalizedHref
  active?: boolean
}

export type HomeHeaderUserProfile = {
  name: string
  avatar: string
}

export type HomeHeaderProps = {
  navigationItems: ReadonlyArray<HomeHeaderNavigationItem>
  profileButtonRef?: RefObject<HTMLButtonElement | null>
  userProfile?: HomeHeaderUserProfile
  onToggleProfile?: () => void
}
