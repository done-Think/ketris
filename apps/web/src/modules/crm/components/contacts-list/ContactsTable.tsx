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

import { alpha, brand, surface } from '@shared/theme/tokens'

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
    <TableContainer sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
      <Table
        size="small"
        aria-label={t('tableAriaLabel')}
        sx={{
          minWidth: 900,
          tableLayout: 'fixed',
          '& .MuiTableCell-root': { borderBottom: 0 },
          '& .MuiTableHead-root .MuiTableCell-root': {
            px: 1,
            py: 0,
            color: brand.neutral[500],
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '0.01em',
            textAlign: 'center',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          },
          '& .MuiTableHead-root .MuiTableCell-root:nth-of-type(1), & .MuiTableHead-root .MuiTableCell-root:nth-of-type(4)':
            {
              textAlign: 'left',
            },
          '& .MuiTableHead-root .MuiTableCell-root:nth-of-type(4), & .MuiTableBody-root .MuiTableCell-root:nth-of-type(4)':
            {
              pl: '104px',
            },
          '& .MuiTableBody-root .MuiTableCell-root': {
            px: 1,
            py: 0,
            color: brand.graphite[500],
            fontSize: 15.5,
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
          },
          '& .MuiTableBody-root .MuiTableCell-root:nth-of-type(4)': {
            textAlign: 'left',
          },
        }}
      >
        <colgroup>
          <col style={{ width: '25%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '21%' }} />
          <col style={{ width: '7%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '7%' }} />
        </colgroup>
        <TableHead>
          <TableRow sx={{ height: 44, bgcolor: surface.app }}>
            {[
              { key: 'name', label: t('tableColumns.name') },
              { key: 'type', label: t('tableColumns.type') },
              { key: 'phone', label: t('tableColumns.phone') },
              { key: 'email', label: t('tableColumns.email') },
              { key: 'properties', label: t('tableColumns.properties') },
              { key: 'lastInteraction', label: t('tableColumns.lastInteraction') },
              { key: 'actions', label: t('tableColumns.actions') },
            ].map(({ key, label }) => (
              <TableCell
                key={key}
                scope="col"
                sx={{
                  ...(key === 'actions' ? { px: '2px !important' } : {}),
                }}
              >
                {label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {contacts.map((contact, index) => (
            <TableRow
              key={contact.id}
              sx={{
                height: 58,
                bgcolor: index % 2 === 1 ? surface.app : surface.paper,
                '&:hover': { bgcolor: alpha.graphite[6] },
              }}
            >
              <TableCell>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                  <ContactAvatar contact={contact} />
                  <Typography noWrap sx={{ fontSize: 16, fontWeight: 650 }}>
                    {contact.name}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell align="center">
                <ContactTypeChip type={contact.type} />
              </TableCell>
              <TableCell align="center">{contact.phone}</TableCell>
              <TableCell>{contact.email}</TableCell>
              <TableCell align="center">{contact.propertyCount}</TableCell>
              <TableCell align="center" sx={{ color: 'text.secondary' }}>
                {contact.lastInteraction}
              </TableCell>
              <TableCell align="center" sx={{ px: '2px !important' }}>
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
