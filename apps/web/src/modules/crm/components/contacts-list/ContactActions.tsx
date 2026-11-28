import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined'
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import EmailRoundedIcon from '@mui/icons-material/EmailRounded'
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded'
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import {
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import * as crmStyles from '../../styles/contact-actions.styles'

import type { InteractionChannel } from '../../types/interaction'
import type { ContactActionsProps } from '../../types/contact'
import { getPhoneDigits, getWhatsAppUrl } from '../../utils/contact-links'

export function ContactActions({
  contact,
  onEditContact,
  onOpenInteractions,
  onOpenMoreOptions,
  onAddLead,
  onContactAction,
}: ContactActionsProps) {
  const t = useTranslations('crm.contacts.actions')
  const tShortcuts = useTranslations('crm.contacts.shortcuts')
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const moreOptionsLabel = t('moreOptions', { name: contact.name })
  const phoneDigits = getPhoneDigits(contact.phone)

  const closeMenu = () => setMenuAnchor(null)

  const iconActions = [
    {
      label: t('editContact', { name: contact.name }),
      icon: EditOutlinedIcon,
      onClick: onEditContact ? () => onEditContact(contact) : undefined,
    },
    {
      label: t('viewInteractions', { name: contact.name }),
      icon: ChatBubbleOutlineRoundedIcon,
      onClick: onOpenInteractions ? () => onOpenInteractions(contact) : undefined,
    },
  ] as const

  const reachActions = [
    phoneDigits
      ? {
          channel: 'PHONE',
          label: tShortcuts('call'),
          icon: PhoneRoundedIcon,
          href: `tel:${phoneDigits}`,
        }
      : null,
    phoneDigits
      ? {
          channel: 'WHATSAPP',
          label: tShortcuts('whatsapp'),
          icon: WhatsAppIcon,
          href: getWhatsAppUrl(contact.phone),
          external: true,
        }
      : null,
    contact.email
      ? {
          channel: 'EMAIL',
          label: tShortcuts('email'),
          icon: EmailRoundedIcon,
          href: `mailto:${contact.email}`,
        }
      : null,
  ].filter((action) => action !== null) as Array<{
    channel: InteractionChannel
    label: string
    icon: typeof PhoneRoundedIcon
    href: string
    external?: boolean
  }>

  const hasManageActions = Boolean(onAddLead || onOpenMoreOptions)
  const hasMenuItems = reachActions.length > 0 || hasManageActions

  return (
    <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.125}>
      {iconActions.map(({ label, icon: Icon, onClick }) => (
        <Tooltip key={label} title={label}>
          <Box component="span" sx={crmStyles.boxSx}>
            <IconButton
              type="button"
              aria-label={label}
              size="small"
              disabled={!onClick}
              onClick={onClick}
              sx={crmStyles.iconButtonSx}
            >
              <Icon sx={crmStyles.iconSx} />
            </IconButton>
          </Box>
        </Tooltip>
      ))}
      <Tooltip title={moreOptionsLabel}>
        <Box component="span" sx={crmStyles.boxSx}>
          <IconButton
            type="button"
            aria-label={moreOptionsLabel}
            aria-haspopup="menu"
            aria-expanded={Boolean(menuAnchor)}
            size="small"
            disabled={!hasMenuItems}
            onClick={(event) => setMenuAnchor(event.currentTarget)}
            sx={crmStyles.iconButtonSx2}
          >
            <MoreHorizRoundedIcon sx={crmStyles.iconSx} />
          </IconButton>
        </Box>
      </Tooltip>
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        {reachActions.map(({ channel, label, icon: Icon, href, external }) => (
          <MenuItem
            key={channel}
            component="a"
            href={href}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            onClick={(event) => {
              if (onContactAction?.(contact, channel) === false) event.preventDefault()
              closeMenu()
            }}
          >
            <ListItemIcon>
              <Icon fontSize="small" />
            </ListItemIcon>
            {label}
          </MenuItem>
        ))}
        {reachActions.length > 0 && hasManageActions ? <Divider /> : null}
        {onAddLead ? (
          <MenuItem
            onClick={() => {
              onAddLead(contact)
              closeMenu()
            }}
          >
            <ListItemIcon>
              <PersonAddAltRoundedIcon fontSize="small" />
            </ListItemIcon>
            {t('addLead', { name: contact.name })}
          </MenuItem>
        ) : null}
        {onOpenMoreOptions ? (
          <MenuItem
            onClick={() => {
              onOpenMoreOptions(contact)
              closeMenu()
            }}
          >
            <ListItemIcon>
              <ArchiveOutlinedIcon fontSize="small" />
            </ListItemIcon>
            {t('archiveContact', { name: contact.name })}
          </MenuItem>
        ) : null}
      </Menu>
    </Stack>
  )
}
