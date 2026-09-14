import {
  Checkbox,
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

import { alpha, brand, iconSize, surface } from '@shared/theme/tokens'

import type { ContactsTableProps } from '../../types/contact'
import { ContactActions } from './ContactActions'
import { ContactAvatar } from './ContactAvatar'
import { ContactTypeChip } from './ContactTypeChip'

export function ContactsTable({
  contacts,
  selectedIds,
  onToggleContact,
  onToggleAll,
  onEditContact,
  onOpenInteractions,
  onOpenMoreOptions,
}: ContactsTableProps) {
  const t = useTranslations('crm.contacts')
  const allSelected =
    contacts.length > 0 && contacts.every((contact) => selectedIds.has(contact.id))
  const someSelected = contacts.some((contact) => selectedIds.has(contact.id)) && !allSelected

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
            fontSize: 10,
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '0.01em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          },
          '& .MuiTableBody-root .MuiTableCell-root': {
            px: 1,
            py: 0,
            color: brand.graphite[500],
            fontSize: 11.5,
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
          },
        }}
      >
        <colgroup>
          <col style={{ width: '4%' }} />
          <col style={{ width: '21%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '21%' }} />
          <col style={{ width: '7%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '7%' }} />
        </colgroup>
        <TableHead>
          <TableRow sx={{ height: 36, bgcolor: surface.app }}>
            <TableCell padding="checkbox" align="center">
              <Checkbox
                size="small"
                checked={allSelected}
                indeterminate={someSelected}
                onChange={onToggleAll}
                slotProps={{ input: { 'aria-label': t('selectAllVisible') } }}
                sx={{
                  width: 24,
                  height: 24,
                  p: 0.5,
                  color: brand.neutral[300],
                  '& .MuiSvgIcon-root': { fontSize: iconSize.sm },
                }}
              />
            </TableCell>
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
                align={key === 'actions' ? 'right' : 'left'}
                sx={key === 'actions' ? { px: '2px !important' } : undefined}
              >
                {label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {contacts.map((contact, index) => {
            const selected = selectedIds.has(contact.id)

            return (
              <TableRow
                key={contact.id}
                selected={selected}
                sx={{
                  height: 50,
                  bgcolor: index % 2 === 1 ? surface.app : surface.paper,
                  '&.Mui-selected, &.Mui-selected:hover': { bgcolor: alpha.magenta[6] },
                  '&:hover': { bgcolor: alpha.graphite[6] },
                }}
              >
                <TableCell padding="checkbox" align="center">
                  <Checkbox
                    size="small"
                    checked={selected}
                    onChange={() => onToggleContact(contact.id)}
                    slotProps={{
                      input: { 'aria-label': t('selectContact', { name: contact.name }) },
                    }}
                    sx={{
                      width: 24,
                      height: 24,
                      p: 0.5,
                      color: brand.neutral[300],
                      '& .MuiSvgIcon-root': { fontSize: iconSize.sm },
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                    <ContactAvatar contact={contact} />
                    <Typography noWrap sx={{ fontSize: 12, fontWeight: 650 }}>
                      {contact.name}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <ContactTypeChip type={contact.type} />
                </TableCell>
                <TableCell>{contact.phone}</TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell align="center">{contact.propertyCount}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{contact.lastInteraction}</TableCell>
                <TableCell align="right" sx={{ px: '2px !important' }}>
                  <ContactActions
                    contact={contact}
                    onEditContact={onEditContact}
                    onOpenInteractions={onOpenInteractions}
                    onOpenMoreOptions={onOpenMoreOptions}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
