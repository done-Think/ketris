import { Avatar } from '@mui/material'
import * as crmStyles from '../../styles/contact-avatar.styles'

import type { ContactAvatarProps } from '../../types/contact'
import { getInitials } from '../../utils/formatters'

export function ContactAvatar({ contact }: ContactAvatarProps) {
  return (
    <Avatar src={contact.avatarUrl} alt="" aria-hidden="true" sx={crmStyles.avatarSx}>
      {getInitials(contact.name)}
    </Avatar>
  )
}
