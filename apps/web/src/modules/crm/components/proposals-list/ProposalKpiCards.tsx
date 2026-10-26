import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import { Box, Paper, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useCrmFormatter } from '../../hooks/use-crm-formatter'
import * as crmStyles from '../../styles/proposal-kpi-cards.styles'

import { brand, supportColor } from '@shared/theme/tokens'

import type { ProposalKpiCardsProps } from '../../types/proposal-management'

export function ProposalKpiCards({ summary }: ProposalKpiCardsProps) {
  const format = useCrmFormatter()
  const t = useTranslations('crm.proposalManagement')
  const cards = [
    {
      label: t('kpis.inNegotiation'),
      value: format.number(summary.negotiationCount),
      icon: AccessTimeRoundedIcon,
      color: brand.semantic.warning,
      backgroundColor: supportColor.warningSoft,
    },
    {
      label: t('kpis.acceptedTotal'),
      value: summary.acceptedTotalLabel,
      icon: AttachMoneyRoundedIcon,
      color: brand.semantic.success,
      backgroundColor: supportColor.successSoft,
    },
    {
      label: t('kpis.conversionRate'),
      value: summary.conversionRateLabel,
      icon: TrendingUpRoundedIcon,
      color: brand.magenta[500],
      backgroundColor: brand.magenta[50],
    },
  ]

  return (
    <Box aria-label={t('kpis.ariaLabel')} sx={crmStyles.boxSx}>
      {cards.map(({ label, value, icon: Icon, color, backgroundColor }) => (
        <Paper key={label} variant="outlined" sx={crmStyles.paperSx}>
          <Box aria-hidden="true" sx={crmStyles.getBoxSx(backgroundColor, color)}>
            <Icon sx={crmStyles.iconSx} />
          </Box>
          <Stack spacing={{ xs: 0.5, md: 0.125 }} sx={crmStyles.stackSx}>
            <Typography noWrap sx={crmStyles.typographySx}>
              {label}
            </Typography>
            <Typography noWrap sx={crmStyles.typographySx2}>
              {value}
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Box>
  )
}
