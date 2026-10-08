import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { ContactsCardsProps } from '../../types/contact'
import { ContactActions } from './ContactActions'
import { ContactAvatar } from './ContactAvatar'
import { ContactTypeChip } from './ContactTypeChip'

export function ContactsCards({
  contacts,
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
            <ContactAvatar contact={contact} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography noWrap sx={{ fontSize: 17, fontWeight: 700 }}>
                {contact.name}
              </Typography>
              <Typography noWrap sx={{ color: 'text.secondary', fontSize: 15 }}>
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
            <Typography sx={{ color: 'text.secondary', fontSize: 15 }}>
              {contact.lastInteraction}
            </Typography>
          </Stack>

          <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Typography sx={{ fontSize: 15.5 }}>{contact.phone}</Typography>
            <Typography sx={{ fontSize: 15.5, fontWeight: 600 }}>
              {t('propertyCount', { count: contact.propertyCount })}
            </Typography>
          </Stack>
        </Stack>
      ))}
    </Stack>
  )
}
