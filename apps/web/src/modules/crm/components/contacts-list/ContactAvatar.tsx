import { Avatar } from '@mui/material'

import { alpha, brand } from '@shared/theme/tokens'

import type { ContactAvatarProps } from '../../types/contact'
import { getInitials } from '../../utils/formatters'

export function ContactAvatar({ contact }: ContactAvatarProps) {
  return (
    <Avatar
      src={contact.avatarUrl}
      alt=""
      aria-hidden="true"
      sx={{
        width: 35,
        height: 35,
        bgcolor: alpha.magenta[10],
        color: brand.magenta[700],
        fontSize: 13.5,
        fontWeight: 800,
      }}
    >
      {getInitials(contact.name)}
    </Avatar>
  )
}
