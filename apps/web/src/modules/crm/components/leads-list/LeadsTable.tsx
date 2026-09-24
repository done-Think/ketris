import {
  Button,
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

import type { LeadsTableProps } from '../../types/lead'
import { LeadAvatar } from './LeadAvatar'
import { LeadStatusChip } from './LeadStatusChip'

const leadTableColumnKeys = [
  'name',
  'interest',
  'budget',
  'status',
  'source',
  'lastContact',
  'actions',
] as const

export function LeadsTable({ leads, onContactLead }: LeadsTableProps) {
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
            {leadTableColumnKeys.map((columnKey) => (
              <TableCell
                key={columnKey}
                scope="col"
                align={columnKey === 'actions' ? 'right' : 'left'}
              >
                {t(`tableColumns.${columnKey}`)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {leads.map((lead, index) => (
            <TableRow
              key={lead.id}
              sx={{
                height: 60,
                bgcolor: index % 2 === 1 ? surface.app : surface.paper,
                transition: 'background-color 160ms ease',
                '&:hover': { bgcolor: alpha.graphite[6] },
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
