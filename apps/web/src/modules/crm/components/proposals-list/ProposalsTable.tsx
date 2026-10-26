import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import * as crmStyles from '../../styles/proposals-table.styles'

import { OverflowTooltipText } from '@shared/components/ui'

import type { ProposalsTableProps } from '../../types/proposal-management'
import { ProposalStatusChip } from '../ProposalStatusChip'
import { ProposalActions } from './ProposalActions'

const proposalTableColumnWidths = ['12%', '17%', '21%', '13%', '15%', '12%', '10%'] as const
const proposalColumnKeys = [
  'proposal',
  'lead',
  'property',
  'value',
  'status',
  'created',
  'actions',
] as const

export function ProposalsTable({
  proposals,
  onViewProposal,
  onOpenMoreOptions,
}: ProposalsTableProps) {
  const t = useTranslations('crm.proposalManagement')
  return (
    <TableContainer sx={crmStyles.tableContainerSx}>
      <Table size="small" aria-label={t('tableAriaLabel')} sx={crmStyles.tableSx}>
        <colgroup>
          {proposalTableColumnWidths.map((width, index) => (
            <Box component="col" key={`${width}-${index}`} sx={crmStyles.getBoxSx(width)} />
          ))}
        </colgroup>
        <TableHead>
          <TableRow sx={crmStyles.tableRowSx}>
            {proposalColumnKeys.map((key) => (
              <TableCell key={key} scope="col" align={key === 'actions' ? 'right' : 'left'}>
                {key === 'actions' ? (
                  <Box component="span" sx={crmStyles.boxSx}>
                    {t(`columns.${key}`)}
                  </Box>
                ) : (
                  t(`columns.${key}`)
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {proposals.map((proposal, index) => (
            <TableRow key={proposal.id} sx={crmStyles.getTableRowSx(index)}>
              <TableCell>
                <OverflowTooltipText sx={crmStyles.overflowTooltipTextSx}>
                  {proposal.reference}
                </OverflowTooltipText>
              </TableCell>
              <TableCell>
                <Stack spacing={0.125} minWidth={0}>
                  <OverflowTooltipText sx={crmStyles.overflowTooltipTextSx2}>
                    {proposal.lead.name}
                  </OverflowTooltipText>
                  <OverflowTooltipText sx={crmStyles.overflowTooltipTextSx3}>
                    {proposal.lead.email}
                  </OverflowTooltipText>
                </Stack>
              </TableCell>
              <TableCell>
                <Stack spacing={0.125} minWidth={0}>
                  <OverflowTooltipText sx={crmStyles.overflowTooltipTextSx2}>
                    {proposal.property.title}
                  </OverflowTooltipText>
                  <OverflowTooltipText sx={crmStyles.overflowTooltipTextSx3}>
                    {proposal.property.address}
                  </OverflowTooltipText>
                </Stack>
              </TableCell>
              <TableCell>
                <OverflowTooltipText sx={crmStyles.overflowTooltipTextSx}>
                  {proposal.valueLabel}
                </OverflowTooltipText>
              </TableCell>
              <TableCell>
                <Box sx={crmStyles.boxSx2}>
                  <ProposalStatusChip status={proposal.status} />
                </Box>
              </TableCell>
              <TableCell>
                <OverflowTooltipText sx={crmStyles.overflowTooltipTextSx4}>
                  {proposal.createdLabel}
                </OverflowTooltipText>
              </TableCell>
              <TableCell align="right">
                <Box sx={crmStyles.boxSx3}>
                  <ProposalActions
                    proposal={proposal}
                    onViewProposal={onViewProposal}
                    onOpenMoreOptions={onOpenMoreOptions}
                  />
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
