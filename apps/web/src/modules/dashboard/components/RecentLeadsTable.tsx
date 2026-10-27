import { leadSourceKey } from '@server/crm/constants/lead-sources'
import {
  Box,
  Chip,
  Link as MuiLink,
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

import { DashboardPanel } from '@shared/components/ui/DashboardPanel'

import type { RecentLeadsTableProps } from '../types/dashboard-overview'
import { getStatusChipStyles, styles } from '../styles/recent-leads-table.styles'

export function RecentLeadsTable({ leads, onLeadSelect }: RecentLeadsTableProps) {
  const t = useTranslations('dashboard.overview.recentLeads')
  const sourceT = useTranslations('dashboard.leadSources')

  return (
    <DashboardPanel>
      <Box sx={styles.box}>
        <Typography sx={styles.typography}>{t('title')}</Typography>

        {leads.length === 0 ? (
          <Typography sx={styles.typography2}>{t('empty')}</Typography>
        ) : (
          <TableContainer sx={styles.tableContainer}>
            <Table size="small" sx={styles.table}>
              <TableHead>
                <TableRow>
                  {[
                    t('columns.name'),
                    t('columns.interest'),
                    t('columns.budget'),
                    t('columns.status'),
                    t('columns.origin'),
                    t('columns.actions'),
                  ].map((heading) => (
                    <TableCell key={heading} sx={styles.tableCell}>
                      {heading}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell sx={styles.tableCell2}>
                      <Typography sx={styles.typography3}>{lead.name}</Typography>
                    </TableCell>
                    <TableCell sx={styles.tableCell2}>
                      <Typography sx={styles.typography4}>{lead.interest}</Typography>
                    </TableCell>
                    <TableCell sx={styles.tableCell2}>
                      <Typography sx={styles.typography5}>{lead.budget}</Typography>
                    </TableCell>
                    <TableCell sx={styles.tableCell2}>
                      <Chip
                        label={t(`statuses.${lead.status}`)}
                        size="small"
                        sx={getStatusChipStyles(lead.status)}
                      />
                    </TableCell>
                    <TableCell sx={styles.tableCell2}>
                      <Typography sx={styles.typography4}>
                        {sourceT(leadSourceKey(lead.source))}
                      </Typography>
                    </TableCell>
                    <TableCell sx={styles.tableCell2}>
                      <Stack direction="row" spacing={1.5}>
                        <MuiLink
                          href={`tel:${lead.phone.replace(/\D/g, '')}`}
                          underline="none"
                          sx={styles.muiLink}
                        >
                          {t('call')}
                        </MuiLink>
                        <MuiLink
                          component="button"
                          underline="none"
                          onClick={() => onLeadSelect(lead)}
                          sx={styles.muiLink2}
                        >
                          {t('details')}
                        </MuiLink>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </DashboardPanel>
  )
}
