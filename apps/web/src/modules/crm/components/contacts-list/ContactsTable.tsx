import {
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import * as crmStyles from '../../styles/contacts-table.styles'

import type { ContactsTableProps } from '../../types/contact'
import { ContactActions } from './ContactActions'
import { ContactAvatar } from './ContactAvatar'
import { ContactTypeChip } from './ContactTypeChip'

export function ContactsTable({
  contacts,
  onEditContact,
  onOpenInteractions,
  onOpenMoreOptions,
}: ContactsTableProps) {
  const t = useTranslations('crm.contacts')

  return (
    <TableContainer sx={crmStyles.tableContainerSx}>
      <Table size="small" aria-label={t('tableAriaLabel')} sx={crmStyles.tableSx}>
        <colgroup>
          <col />
          <col />
          <col />
          <col />
          <col />
          <col />
          <col />
        </colgroup>
        <TableHead>
          <TableRow sx={crmStyles.tableRowSx}>
            {[
              { key: 'name', label: t('tableColumns.name') },
              { key: 'type', label: t('tableColumns.type') },
              { key: 'phone', label: t('tableColumns.phone') },
              { key: 'email', label: t('tableColumns.email') },
              { key: 'properties', label: t('tableColumns.properties') },
              { key: 'lastInteraction', label: t('tableColumns.lastInteraction') },
              { key: 'actions', label: t('tableColumns.actions') },
            ].map(({ key, label }) => (
              <TableCell key={key} scope="col">
                {label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {contacts.map((contact, index) => (
            <TableRow key={contact.id} sx={crmStyles.getTableRowSx(index)}>
              <TableCell>
                <Stack direction="row" spacing={1} alignItems="center" sx={crmStyles.stackSx}>
                  <ContactAvatar contact={contact} />
                  <Typography noWrap title={contact.name} sx={crmStyles.typographySx}>
                    {contact.name}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell align="center">
                <ContactTypeChip type={contact.type} />
              </TableCell>
              <TableCell align="center">{contact.phone}</TableCell>
              <TableCell align="center">
                <Typography noWrap title={contact.email} sx={crmStyles.typographySx2}>
                  {contact.email}
                </Typography>
              </TableCell>
              <TableCell align="center">{contact.propertyCount}</TableCell>
              <TableCell align="center" sx={crmStyles.tableCellSx}>
                <Typography noWrap title={contact.lastInteraction} sx={crmStyles.typographySx2}>
                  {contact.lastInteraction}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <ContactActions
                  contact={contact}
                  onEditContact={onEditContact}
                  onOpenInteractions={onOpenInteractions}
                  onOpenMoreOptions={onOpenMoreOptions}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
