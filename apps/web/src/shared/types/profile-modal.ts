import type { ComponentType, RefObject } from 'react'
import type { SvgIconProps } from '@mui/material/SvgIcon'

export type ProfileModalUserProfile = {
  name: string
  role: string
  company: string
  email: string
  avatar: string
}

export type ProfileModalAction = {
  label: string
  icon: ComponentType<SvgIconProps>
  href: string
  tone?: 'danger'
}

export type ProfileModalProps = {
  open: boolean
  anchorRef: RefObject<HTMLButtonElement>
  userProfile: ProfileModalUserProfile
  actions: ProfileModalAction[]
  onClose: () => void
}
