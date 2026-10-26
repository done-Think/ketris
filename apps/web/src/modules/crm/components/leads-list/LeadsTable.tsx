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
import * as crmStyles from '../../styles/leads-table.styles'

import type { LeadTableColumn, LeadsTableProps } from '../../types/lead'
import { LeadAvatar } from './LeadAvatar'
import { LeadStatusChip } from './LeadStatusChip'

const leadTableColumns: LeadTableColumn[] = [
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
          {leads.map((lead, index) => (
            <TableRow key={lead.id} sx={crmStyles.getTableRowSx(index)}>
              <TableCell>
                <Stack direction="row" alignItems="center" spacing={1.2} sx={crmStyles.stackSx}>
                  <LeadAvatar lead={lead} />
                  <Typography noWrap title={lead.name} sx={crmStyles.typographySx}>
                    {lead.name}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>
                <Typography noWrap title={lead.interest} sx={crmStyles.typographySx2}>
                  {lead.interest}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography noWrap title={lead.budget} sx={crmStyles.typographySx3}>
                  {lead.budget}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <LeadStatusChip stage={lead.stage} />
              </TableCell>
              <TableCell>
                <Typography noWrap title={lead.source} sx={crmStyles.typographySx2}>
                  {lead.source}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography noWrap title={lead.lastContact} sx={crmStyles.typographySx2}>
                  {lead.lastContact}
                </Typography>
              </TableCell>
              <TableCell>
                <Button
                  type="button"
                  size="small"
                  disabled={!onContactLead}
                  onClick={() => onContactLead?.(lead)}
                  sx={crmStyles.buttonSx}
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
