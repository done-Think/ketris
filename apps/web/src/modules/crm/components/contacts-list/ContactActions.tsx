import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import { Box, IconButton, Stack, Tooltip } from '@mui/material'

import { alpha, brand, iconSize } from '@shared/theme/tokens'

import type { ContactActionsProps } from '../../types/contact'

export function ContactActions({
  contact,
  onEditContact,
  onOpenInteractions,
  onOpenMoreOptions,
}: ContactActionsProps) {
  const actions = [
    {
      label: `Editar ${contact.name}`,
      icon: EditOutlinedIcon,
      onClick: onEditContact ? () => onEditContact(contact) : undefined,
    },
    {
      label: `Ver interações de ${contact.name}`,
      icon: ChatBubbleOutlineRoundedIcon,
      onClick: onOpenInteractions ? () => onOpenInteractions(contact) : undefined,
    },
    {
      label: `Mais opções para ${contact.name}`,
      icon: MoreHorizRoundedIcon,
      onClick: onOpenMoreOptions ? () => onOpenMoreOptions(contact) : undefined,
    },
  ] as const

  return (
    <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.25}>
      {actions.map(({ label, icon: Icon, onClick }) => (
        <Tooltip key={label} title={label}>
          <Box component="span" sx={{ display: 'inline-flex' }}>
            <IconButton
              type="button"
              aria-label={label}
              size="small"
              disabled={!onClick}
              onClick={onClick}
              sx={{
                width: 28,
                height: 28,
                color: brand.neutral[500],
                '&:hover': { bgcolor: alpha.graphite[6], color: brand.neutral[700] },
                '&.Mui-disabled': { color: brand.neutral[500] },
              }}
            >
              <Icon sx={{ fontSize: iconSize.lg }} />
            </IconButton>
          </Box>
        </Tooltip>
      ))}
    </Stack>
  )
}
