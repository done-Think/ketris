import {
  Box,
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

import { alpha, brand, iconSize, surface } from '@shared/theme/tokens'

import type { ContactsTableProps } from '../../types/contact'
import { ContactActions } from './ContactActions'
import { ContactAvatar } from './ContactAvatar'
import { ContactTypeChip } from './ContactTypeChip'

const contactTableColumnWidths = ['4%', '19%', '12%', '13%', '21%', '7%', '14%', '10%'] as const

export function ContactsTable({
  contacts,
  selectedIds,
  onToggleContact,
  onToggleAll,
  onEditContact,
  onOpenInteractions,
  onOpenMoreOptions,
}: ContactsTableProps) {
  const allSelected =
    contacts.length > 0 && contacts.every((contact) => selectedIds.has(contact.id))
  const someSelected = contacts.some((contact) => selectedIds.has(contact.id)) && !allSelected

  return (
    <TableContainer sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
      <Table
        size="small"
        aria-label="Contatos do CRM"
        sx={{
          minWidth: 900,
          tableLayout: 'fixed',
          '& .MuiTableCell-root': { borderBottom: 0 },
          '& .MuiTableHead-root .MuiTableCell-root': {
            px: 1,
            py: 0,
            color: brand.neutral[500],
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1.3,
            letterSpacing: '0.01em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          },
          '& .MuiTableBody-root .MuiTableCell-root': {
            px: 1,
            py: 0,
            color: brand.graphite[500],
            fontSize: 12.5,
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
          },
          '& .MuiTableHead-root .MuiTableCell-root:last-of-type, & .MuiTableBody-root .MuiTableCell-root:last-of-type':
            {
              px: 0.125,
            },
        }}
      >
        <colgroup>
          {contactTableColumnWidths.map((width, index) => (
            <Box component="col" key={`${width}-${index}`} sx={{ width }} />
          ))}
        </colgroup>
        <TableHead>
          <TableRow sx={{ height: 40, bgcolor: surface.app }}>
            <TableCell padding="checkbox" align="center">
              <Checkbox
                size="small"
                checked={allSelected}
                indeterminate={someSelected}
                onChange={onToggleAll}
                slotProps={{ input: { 'aria-label': 'Selecionar todos os contatos visíveis' } }}
                sx={{
                  width: 24,
                  height: 24,
                  p: 0.5,
                  color: brand.neutral[300],
                  '& .MuiSvgIcon-root': { fontSize: iconSize.lg },
                }}
              />
            </TableCell>
            {['Nome', 'Tipo', 'Telefone', 'Email', 'Imóveis', 'Última interação', 'Ações'].map(
              (label) => (
                <TableCell key={label} scope="col" align={label === 'Ações' ? 'right' : 'left'}>
                  {label}
                </TableCell>
              ),
            )}
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
                  height: 54,
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
                    slotProps={{ input: { 'aria-label': `Selecionar ${contact.name}` } }}
                    sx={{
                      width: 24,
                      height: 24,
                      p: 0.5,
                      color: brand.neutral[300],
                      '& .MuiSvgIcon-root': { fontSize: iconSize.lg },
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                    <ContactAvatar contact={contact} />
                    <Typography noWrap sx={{ fontSize: 13, fontWeight: 700 }}>
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
                <TableCell align="right">
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
