import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import type { SvgIconComponent } from '@mui/icons-material'

import type { TenantAccountType } from '../types/tenant'

export const accountTypeIcons: Record<TenantAccountType, SvgIconComponent> = {
  INDIVIDUAL: PersonOutlineRoundedIcon,
  BROKER: BadgeOutlinedIcon,
  AGENCY: ApartmentOutlinedIcon,
}

// "Imobiliária São João" → "IS"; used by the account previews.
export function accountInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toLocaleUpperCase() ?? '')
    .join('')
}
