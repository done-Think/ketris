import { Avatar } from '@mui/material'

import { alpha, brand } from '@shared/theme/tokens'

import type { LeadAvatarProps } from '../../types/lead'
import { getInitials } from '../../utils/formatters'

export function LeadAvatar({ lead }: LeadAvatarProps) {
  return (
    <Avatar
      aria-hidden="true"
      sx={{
        width: 35,
        height: 35,
        bgcolor: alpha.magenta[10],
        color: brand.magenta[700],
        fontSize: 13.5,
        fontWeight: 900,
      }}
    >
      {getInitials(lead.name)}
    </Avatar>
  )
}
