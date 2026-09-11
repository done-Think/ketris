import type { SvgIconProps } from '@mui/material/SvgIcon'
import type { ComponentType } from 'react'
import type { LocalizedStringHref } from '@shared/types/localized-href'

export type ProfileActionTranslationKey = 'support' | 'settings' | 'switchMode' | 'signOut'

export type ProfileAction = {
  labelKey: ProfileActionTranslationKey
  icon: ComponentType<SvgIconProps>
  href?: LocalizedStringHref
  onClick?: () => void
  tone?: 'danger'
}
