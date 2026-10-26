import { Avatar } from '@mui/material'
import * as crmStyles from '../../styles/lead-avatar.styles'

import type { LeadAvatarProps } from '../../types/lead'
import { getInitials } from '../../utils/formatters'

export function LeadAvatar({ lead }: LeadAvatarProps) {
  return (
    <Avatar aria-hidden="true" sx={crmStyles.avatarSx}>
      {getInitials(lead.name)}
    </Avatar>
  )
}
