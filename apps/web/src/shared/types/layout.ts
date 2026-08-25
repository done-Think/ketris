import type { SvgIconProps } from '@mui/material/SvgIcon'
import type { ComponentType, RefObject } from 'react'

export type HeaderNavigationItem = {
  label: string
  href: string
  active?: boolean
}

export type HeaderUserProfile = {
  name: string
  avatar: string
}

export type HomeHeaderProps = {
  navigationItems: ReadonlyArray<HeaderNavigationItem>
  profileButtonRef?: RefObject<HTMLButtonElement | null>
  userProfile?: HeaderUserProfile
  onToggleProfile?: () => void
}

export type ProfileModalUserProfile = HeaderUserProfile & {
  role: string
  company: string
  email: string
}

export type ProfileModalAction = {
  label: string
  icon: ComponentType<SvgIconProps>
  href: string
  tone?: 'danger'
}

export type ProfileLanguageCode = 'pt-BR' | 'en' | 'es'

export type ProfileModalProps = {
  open: boolean
  anchorRef: RefObject<HTMLButtonElement | null>
  userProfile: ProfileModalUserProfile
  actions: ProfileModalAction[]
  onClose: () => void
}
