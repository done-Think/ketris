import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import { Box } from '@mui/material'
import { useTranslations } from 'next-intl'

import { useFinancialSummary } from '../hooks/use-financial'
import { useFinancialFormat } from '../hooks/use-financial-format'
import { styles } from '../styles/charges-kpis.styles'
import type { ChargesKpisProps } from '../types/charge'
import { Metric } from './Metric'

export function ChargesKpis({ month }: ChargesKpisProps) {
  const t = useTranslations('charges.kpis')
  const format = useFinancialFormat()
  const summary = useFinancialSummary(month).data

  return (
    <Box sx={styles.grid}>
      <Metric
        label={t('receivable')}
        value={format.currency(summary?.monthlyReceivable ?? 0)}
        icon={<TrendingUpRoundedIcon />}
        tone="success"
      />
      <Metric
        label={t('overdue')}
        value={format.currency(summary?.overdueTotal ?? 0)}
        icon={<TrendingDownRoundedIcon />}
        tone="error"
      />
      <Metric
        label={t('defaultRate')}
        value={format.percent(summary?.defaultRatePercentage ?? 0)}
        icon={<TrendingDownRoundedIcon />}
        tone="warning"
      />
    </Box>
  )
}
