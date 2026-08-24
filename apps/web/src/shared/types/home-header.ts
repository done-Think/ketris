import type { RefObject } from 'react'

export type HomeHeaderNavigationItem = {
  label: string
  href: string
  active?: boolean
}

export type HomeHeaderUserProfile = {
  name: string
  avatar: string
}

export type HomeHeaderProps = {
  navigationItems: ReadonlyArray<HomeHeaderNavigationItem>
  profileButtonRef?: RefObject<HTMLButtonElement>
  userProfile?: HomeHeaderUserProfile
  onToggleProfile?: () => void
}
