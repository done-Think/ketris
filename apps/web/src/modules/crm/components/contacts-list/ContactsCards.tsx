import { Box, Checkbox, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { iconSize } from '@shared/theme/tokens'

import type { ContactsCardsProps } from '../../types/contact'
import { ContactActions } from './ContactActions'
import { ContactAvatar } from './ContactAvatar'
import { ContactTypeChip } from './ContactTypeChip'

export function ContactsCards({
  contacts,
  selectedIds,
  onToggleContact,
  onEditContact,
  onOpenInteractions,
  onOpenMoreOptions,
}: ContactsCardsProps) {
  const t = useTranslations('crm.contacts')

  return (
    <Stack
      aria-label={t('mobileListAriaLabel')}
      sx={{ display: { xs: 'flex', md: 'none' } }}
      divider={<Box sx={{ borderTop: 1, borderColor: 'divider' }} />}
    >
      {contacts.map((contact) => (
        <Stack key={contact.id} spacing={1.25} sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Checkbox
              size="small"
              checked={selectedIds.has(contact.id)}
              onChange={() => onToggleContact(contact.id)}
              slotProps={{ input: { 'aria-label': t('selectContact', { name: contact.name }) } }}
              sx={{ ml: -0.5, p: 0.5, '& .MuiSvgIcon-root': { fontSize: iconSize.md } }}
            />
            <ContactAvatar contact={contact} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography noWrap sx={{ fontSize: 13, fontWeight: 700 }}>
                {contact.name}
              </Typography>
              <Typography noWrap sx={{ color: 'text.secondary', fontSize: 11 }}>
                {contact.email}
              </Typography>
            </Box>
            <ContactActions
              contact={contact}
              onEditContact={onEditContact}
              onOpenInteractions={onOpenInteractions}
              onOpenMoreOptions={onOpenMoreOptions}
            />
          </Stack>

          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <ContactTypeChip type={contact.type} />
            <Typography sx={{ color: 'text.secondary', fontSize: 11 }}>
              {contact.lastInteraction}
            </Typography>
          </Stack>

          <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Typography sx={{ fontSize: 11.5 }}>{contact.phone}</Typography>
            <Typography sx={{ fontSize: 11.5, fontWeight: 600 }}>
              {t('propertyCount', { count: contact.propertyCount })}
            </Typography>
          </Stack>
        </Stack>
      ))}
    </Stack>
  )
}
