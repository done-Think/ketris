import { styles } from '../styles/contracts-summary-cards.styles'
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { contractMetricToneStyles } from '../styles/contract-status.styles'
import type { ContractsSummaryCardsProps } from '../types/contract'

export function ContractsSummaryCards({ metrics }: ContractsSummaryCardsProps) {
  const t = useTranslations('contracts.summary')

  return (
    <Box sx={styles.box}>
      {metrics.map((metric) => {
        const tone = contractMetricToneStyles[metric.tone]
        const MetricIcon = metric.tone === 'warning' ? ShowChartRoundedIcon : TrendingUpRoundedIcon

        return (
          <Stack
            key={metric.label}
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ xs: 'flex-start', md: 'center' }}
            justifyContent="space-between"
            spacing={{ xs: 0.4, md: 2 }}
            sx={styles.stack}
          >
            <Stack spacing={0.7} sx={styles.stack2}>
              <Typography noWrap sx={styles.typography}>
                {t(`${metric.label}.label`)}
              </Typography>
              <Typography sx={styles.typography2}>{metric.value}</Typography>
              <Typography noWrap sx={styles.typography3}>
                {t(`${metric.label}.caption`)}
              </Typography>
            </Stack>
            <Box aria-hidden sx={styles.box2(tone)}>
              <MetricIcon sx={styles.metricIcon} />
            </Box>
          </Stack>
        )
      })}
    </Box>
  )
}
