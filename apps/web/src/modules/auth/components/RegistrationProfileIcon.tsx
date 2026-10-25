import { styles } from '../styles/registration-profile-icon.styles'
import { Box } from '@mui/material'
import type { SvgIconComponent } from '@mui/icons-material'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'

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
    <Box aria-hidden="true" sx={styles.box}>
      <Icon sx={styles.icon} />
    </Box>
  )
}
