import {
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'

import { brand, surface } from '@shared/theme/tokens'

import type { LeadTableSortField, LeadsTableProps } from '../../types/lead'
import { LeadAvatar } from './LeadAvatar'
import { LeadStatusChip } from './LeadStatusChip'

const leadTableColumns: {
  key: 'name' | 'interest' | 'budget' | 'status' | 'source' | 'lastContact' | 'actions'
  sortField?: LeadTableSortField
}[] = [
  { key: 'name', sortField: 'name' },
  { key: 'interest', sortField: 'interest' },
  { key: 'budget', sortField: 'budget' },
  { key: 'status', sortField: 'stage' },
  { key: 'source', sortField: 'source' },
  { key: 'lastContact', sortField: 'lastContact' },
  { key: 'actions' },
]

export function LeadsTable({ leads, sort, onContactLead, onSortChange }: LeadsTableProps) {
  const t = useTranslations('crm.leads')

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
            textAlign: 'left',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          },
          '& .MuiTableHead-root .MuiTableCell-root:nth-of-type(4), & .MuiTableBody-root .MuiTableCell-root:nth-of-type(4)':
            {
              textAlign: 'center',
              transform: 'translateX(-50px)',
            },
          '& .MuiTableHead-root .MuiTableCell-root:nth-of-type(3), & .MuiTableBody-root .MuiTableCell-root:nth-of-type(3)':
            {
              textAlign: 'center',
              transform: 'translateX(-40px)',
            },
          '& .MuiTableBody-root .MuiTableCell-root:nth-of-type(3)': {
            transform: 'translateX(-50px)',
          },
          '& .MuiTableBody-root .MuiTableCell-root:nth-of-type(4)': {
            transform: 'translateX(-60px)',
          },
          '& .MuiTableHead-root .MuiTableCell-root:nth-of-type(6), & .MuiTableBody-root .MuiTableCell-root:nth-of-type(6)':
            {
              textAlign: 'center',
            },
          '& .MuiTableHead-root .MuiTableCell-root:nth-of-type(6) .MuiTableSortLabel-root': {
            justifyContent: 'center',
            width: '100%',
          },
          '& .MuiTableBody-root .MuiTableCell-root:nth-of-type(6) .MuiTypography-root': {
            textAlign: 'center',
          },
          '& .MuiTableHead-root .MuiTableCell-root:nth-of-type(1)': {
            transform: 'translateX(10px)',
          },
          '& .MuiTableSortLabel-root': {
            color: 'inherit',
            font: 'inherit',
            textTransform: 'inherit',
          },
          '& .MuiTableSortLabel-root:hover, & .MuiTableSortLabel-root.Mui-active': {
            color: brand.neutral[500],
          },
          '& .MuiTableSortLabel-icon': {
            color: `${brand.neutral[500]} !important`,
          },
          '& .MuiTableBody-root .MuiTableCell-root': {
            px: 1,
            py: 0,
            color: brand.graphite[500],
            fontSize: 15.5,
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
          },
        }}
      >
        <colgroup>
          <col style={{ width: '23%' }} />
          <col style={{ width: '20%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '6%' }} />
        </colgroup>
        <TableHead>
          <TableRow sx={{ height: 44, bgcolor: surface.app }}>
            {leadTableColumns.map(({ key, sortField }) => (
              <TableCell
                key={key}
                scope="col"
                sortDirection={sortField && sort?.field === sortField ? sort.direction : false}
              >
                {sortField ? (
                  <TableSortLabel
                    active={sort?.field === sortField}
                    direction={sort?.field === sortField ? sort.direction : 'asc'}
                    onClick={() => onSortChange(sortField)}
                  >
                    {t(`tableColumns.${key}`)}
                  </TableSortLabel>
                ) : (
                  t(`tableColumns.${key}`)
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {leads.map((lead) => (
            <TableRow
              key={lead.id}
              sx={{
                height: 58,
                bgcolor: surface.paper,
                transition: 'background-color 160ms ease',
                '&:hover': { bgcolor: brand.neutral[50] },
              }}
            >
              <TableCell>
                <Stack direction="row" alignItems="center" spacing={1.2} sx={{ minWidth: 0 }}>
                  <LeadAvatar lead={lead} />
                  <Typography noWrap sx={{ fontSize: 16, fontWeight: 650 }}>
                    {lead.name}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>
                <Typography noWrap sx={{ color: 'text.secondary', fontSize: 15.5 }}>
                  {lead.interest}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography noWrap sx={{ fontSize: 15.5, fontWeight: 800 }}>
                  {lead.budget}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <LeadStatusChip stage={lead.stage} />
              </TableCell>
              <TableCell>
                <Typography noWrap sx={{ color: 'text.secondary', fontSize: 15.5 }}>
                  {lead.source}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography noWrap sx={{ color: 'text.secondary', fontSize: 15.5 }}>
                  {lead.lastContact}
                </Typography>
              </TableCell>
              <TableCell>
                <Button
                  type="button"
                  size="small"
                  disabled={!onContactLead}
                  onClick={() => onContactLead?.(lead)}
                  sx={{ minWidth: 0, px: 0.6, fontSize: 15.5, fontWeight: 800 }}
                >
                  {t('contactAction')}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
