import type { SvgIconProps } from '@mui/material/SvgIcon'
import type { ComponentType } from 'react'

export type UserProfile = {
  name: string
  role: string
  company: string
  email: string
  avatar: string
}

export type ProfileAction = {
  label: string
  icon: ComponentType<SvgIconProps>
  href: string
  tone?: 'danger'
}
