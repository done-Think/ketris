'use client'

import { Box, Chip, Stack, Typography } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { alpha, brand, motion, radius, shadows, surface } from '@shared/theme/tokens'

import { financialStatusStyles } from '../config/financial-status-styles'
import type { FinancialUpcomingDue, FinancialUpcomingDueListProps } from '../types/financial-entry'
import { FinancialDueHistoryDialog } from './FinancialDueHistoryDialog'

export function FinancialUpcomingDueList({ items }: FinancialUpcomingDueListProps) {
  const format = useFormatter()
  const t = useTranslations('dashboard.finance')
  const statusT = useTranslations('dashboard.finance.statuses')
  const searchParams = useSearchParams()
  const [selectedDue, setSelectedDue] = useState<FinancialUpcomingDue | null>(null)
  const formatCurrency = (value: number) =>
    format.number(value, {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })
  const openDueHistory = (due: FinancialUpcomingDue) => {
    setSelectedDue(due)
  }

  useEffect(() => {
    const dueId = searchParams.get('dueId')
    const due = items.find((item) => item.id === dueId)
    if (!due) return

    setSelectedDue(due)
  }, [items, searchParams])

  return (
    <Box
      sx={{
        bgcolor: surface.paper,
        border: '1px solid',
        borderColor: alpha.graphite[6],
        borderRadius: `${radius.sm}px`,
        boxShadow: shadows.propertyCard,
        p: { xs: 2, md: 2.4 },
      }}
    >
      <Typography sx={{ color: brand.graphite[500], fontSize: 18, fontWeight: 900, mb: 1.8 }}>
        {t('upcomingDuesTitle')}
      </Typography>

      <Stack spacing={1}>
        {items.map((item) => {
          const status = financialStatusStyles[item.status]

          return (
            <Box
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => openDueHistory(item)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  openDueHistory(item)
                }
              }}
              sx={{
                bgcolor: surface.app,
                borderRadius: `${radius.sm}px`,
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) auto auto auto',
                alignItems: 'center',
                columnGap: 1.2,
                justifyItems: 'stretch',
                px: 1.2,
                py: 1,
                textAlign: 'left',
                transition: motion.transition.bordered,
                width: '100%',
                '&:hover': {
                  bgcolor: alpha.magenta[6],
                },
                '&:focus-visible': {
                  boxShadow: `0 0 0 2px ${alpha.magenta[14]}`,
                  outline: 0,
                },
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  noWrap
                  sx={{
                    color: brand.graphite[500],
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  {item.property}
                </Typography>
                <Typography
                  noWrap
                  sx={{ color: brand.neutral[500], display: 'block', fontSize: 11 }}
                >
                  {item.client}
                </Typography>
              </Box>
              <Typography sx={{ color: brand.graphite[500], fontSize: 12, fontWeight: 900 }}>
                {formatCurrency(item.amountValue)}
              </Typography>
              <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 700 }}>
                {item.dueDate}
              </Typography>
              <Chip
                label={statusT(item.status)}
                size="small"
                sx={{
                  bgcolor: status.bgcolor,
                  color: status.color,
                  borderRadius: `${radius.full}px`,
                  fontSize: 10,
                  fontWeight: 900,
                }}
              />
            </Box>
          )
        })}
      </Stack>
      <FinancialDueHistoryDialog
        due={selectedDue}
        open={Boolean(selectedDue)}
        onClose={() => setSelectedDue(null)}
      />
    </Box>
  )
}
