import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import * as crmStyles from '../../styles/contacts-cards.styles'

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
    <Stack aria-label={t('mobileListAriaLabel')} divider={<Box sx={crmStyles.boxSx} />}>
      {contacts.map((contact) => (
        <Stack key={contact.id} spacing={1.25} sx={crmStyles.stackSx}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ContactAvatar contact={contact} />
            <Box sx={crmStyles.boxSx2}>
              <Typography noWrap sx={crmStyles.typographySx}>
                {contact.name}
              </Typography>
              <Typography noWrap sx={crmStyles.typographySx2}>
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
            <Typography sx={crmStyles.typographySx2}>{contact.lastInteraction}</Typography>
          </Stack>

          <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Typography sx={crmStyles.typographySx3}>{contact.phone}</Typography>
            <Typography sx={crmStyles.typographySx4}>
              {t('propertyCount', { count: contact.propertyCount })}
            </Typography>
          </Stack>
        </Stack>
      ))}
    </Stack>
  )
}
