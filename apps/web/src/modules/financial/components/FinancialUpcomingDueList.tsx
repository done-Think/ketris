'use client'

import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { useFinancialFormat } from '../hooks/use-financial-format'
import type { FinancialUpcomingDueListProps } from '../types/financial-entry'
import { ChargeStatusChip } from './ChargeStatusChip'
import { styles } from '../styles/financial-upcoming-due-list.styles'

export function FinancialUpcomingDueList({ items, onOpen }: FinancialUpcomingDueListProps) {
  const t = useTranslations('dashboard.finance')
  const format = useFinancialFormat()

  return (
    <Box sx={styles.card}>
      <Typography sx={styles.title}>{t('upcomingDuesTitle')}</Typography>

      <Stack spacing={1}>
        {items.map((item) => {
          return (
            <Box
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpen(item.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onOpen(item.id)
                }
              }}
              sx={styles.item}
            >
              <Box sx={styles.itemText}>
                <Typography noWrap sx={styles.property}>
                  {item.property}
                </Typography>
                <Typography noWrap sx={styles.client}>
                  {item.client}
                </Typography>
              </Box>
              <Typography noWrap sx={styles.amount}>
                {format.currency(item.amountValue)}
              </Typography>
              <Typography noWrap sx={styles.dueDate}>
                {format.dayMonth(item.dueDate)}
              </Typography>
              <Box sx={styles.status}>
                <ChargeStatusChip status={item.status} />
              </Box>
            </Box>
          )
        })}
      </Stack>
    </Box>
  )
}
