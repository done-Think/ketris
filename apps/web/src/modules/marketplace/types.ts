import type { SvgIconProps } from '@mui/material/SvgIcon'
import type { ComponentType } from 'react'

export type MiniMarketplaceProperty = {
  title: string
  location: string
  image: string
}

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

export type FooterColumn = {
  title: string
  links: Array<{
    label: string
    href: string
  }>
}
