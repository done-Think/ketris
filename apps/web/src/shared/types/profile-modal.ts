import type { ComponentType, RefObject } from 'react'
import type { SvgIconProps } from '@mui/material/SvgIcon'
import type { LocalizedStringHref } from './localized-href'

export type ProfileModalUserProfile = {
  name: string
  company: string
  email: string
  avatar: string
}

export type ProfileModalAction = {
  label: string
  icon: ComponentType<SvgIconProps>
  href: LocalizedStringHref
  tone?: 'danger'
}

export type ProfileModalProps = {
  open: boolean
  anchorRef: RefObject<HTMLButtonElement | null>
  userProfile: ProfileModalUserProfile
  actions: ProfileModalAction[]
  onClose: () => void
}
