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
            px: 1.25,
            py: 0,
            color: brand.neutral[500],
            fontSize: 10.5,
            fontWeight: 800,
            lineHeight: 1.3,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
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
            px: 1.25,
            py: 0,
            color: brand.graphite[500],
            fontSize: 12.5,
            lineHeight: 1.35,
          },
        }}
      >
        <colgroup>
          <col style={{ width: '19%' }} />
          <col style={{ width: '19%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '10%' }} />
        </colgroup>
        <TableHead>
          <TableRow sx={{ height: 40, bgcolor: surface.app }}>
            {leadTableColumns.map(({ key, sortField }) => (
              <TableCell
                key={key}
                scope="col"
                align={key === 'actions' ? 'right' : 'left'}
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
                height: 60,
                bgcolor: surface.paper,
                transition: 'background-color 160ms ease',
                '&:hover': { bgcolor: brand.neutral[50] },
              }}
            >
              <TableCell>
                <Stack direction="row" alignItems="center" spacing={1.2} sx={{ minWidth: 0 }}>
                  <LeadAvatar lead={lead} />
                  <Typography noWrap sx={{ fontSize: 12.5, fontWeight: 800 }}>
                    {lead.name}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>
                <Typography noWrap sx={{ color: 'text.secondary', fontSize: 12.5 }}>
                  {lead.interest}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography noWrap sx={{ fontSize: 12.5, fontWeight: 800 }}>
                  {lead.budget}
                </Typography>
              </TableCell>
              <TableCell>
                <LeadStatusChip stage={lead.stage} />
              </TableCell>
              <TableCell>
                <Typography noWrap sx={{ color: 'text.secondary', fontSize: 12.5 }}>
                  {lead.source}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography noWrap sx={{ color: 'text.secondary', fontSize: 12.5 }}>
                  {lead.lastContact}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Button
                  type="button"
                  size="small"
                  disabled={!onContactLead}
                  onClick={() => onContactLead?.(lead)}
                  sx={{ minWidth: 0, px: 0.6, fontSize: 12, fontWeight: 800 }}
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
