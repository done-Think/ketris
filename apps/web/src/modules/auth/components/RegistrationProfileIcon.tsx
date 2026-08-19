import { Box } from '@mui/material'
import type { SvgIconComponent } from '@mui/icons-material'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'

import { brand, iconSize, radius } from '@shared/theme/tokens'

import type {
  RegistrationProfileIcon as RegistrationProfileIconVariant,
  RegistrationProfileIconProps,
} from '../types/registration'

const profileIcons: Record<RegistrationProfileIconVariant, SvgIconComponent> = {
  owner: HomeOutlinedIcon,
  broker: BadgeOutlinedIcon,
  agency: BusinessOutlinedIcon,
  developer: ApartmentOutlinedIcon,
  tenant: SearchOutlinedIcon,
}

export function RegistrationProfileIcon({ variant }: RegistrationProfileIconProps) {
  const Icon = profileIcons[variant]

  return (
    <Box
      aria-hidden="true"
      sx={{
        width: 48,
        height: 48,
        display: 'grid',
        placeItems: 'center',
        borderRadius: `${radius.full}px`,
        bgcolor: brand.magenta[50],
      }}
    >
      <Icon sx={{ color: brand.magenta[500], fontSize: iconSize.xl }} />
    </Box>
  )
}
