import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import { Box, IconButton, Menu, MenuItem, Stack, Tooltip } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import * as crmStyles from '../../styles/contact-actions.styles'

import type { ContactActionsProps } from '../../types/contact'

export function ContactActions({
  contact,
  onEditContact,
  onOpenInteractions,
  onOpenMoreOptions,
}: ContactActionsProps) {
  const t = useTranslations('crm.contacts.actions')
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const moreOptionsLabel = t('moreOptions', { name: contact.name })

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
            disabled={!onOpenMoreOptions}
            onClick={(event) => setMenuAnchor(event.currentTarget)}
            sx={crmStyles.iconButtonSx2}
          >
            <MoreHorizRoundedIcon sx={crmStyles.iconSx} />
          </IconButton>
        </Box>
      </Tooltip>
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem
          onClick={() => {
            onOpenMoreOptions?.(contact)
            setMenuAnchor(null)
          }}
        >
          {t('archiveContact', { name: contact.name })}
        </MenuItem>
      </Menu>
    </Stack>
  )
}
