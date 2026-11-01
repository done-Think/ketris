'use client'

import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import { useFormatter, useTranslations } from 'next-intl'
import { useState } from 'react'

import { chartSeriesColor } from '../../../styles/tokens'

import type { OverviewSectionProps } from '../../../types/console.types'
import { cardStyles, overviewStyles } from '../../../styles/console.styles'

const seriesKeys = ['approved', 'rejected', 'redo'] as const

export function SessionsByDayCard({ overview }: OverviewSectionProps) {
  const t = useTranslations('face_check.console.overview.chart')
  const format = useFormatter()
  const [showTable, setShowTable] = useState(false)
  const rows = overview.daily.map((point) => ({
    label: format.dateTime(new Date(point.day), { weekday: 'short' }),
    approved: point.approved,
    rejected: point.rejected,
    redo: point.redo,
  }))

  return (
    <Box component="section" aria-labelledby="sessions-by-day" sx={cardStyles.card}>
      <Box sx={cardStyles.header}>
        <Typography id="sessions-by-day" component="h2" sx={cardStyles.title}>
          {t('title')}
        </Typography>
        {overview.completed > 0 ? (
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            onClick={() => setShowTable(!showTable)}
          >
            {showTable ? t('showChart') : t('showTable')}
          </Button>
        ) : null}
      </Box>

      {overview.completed === 0 ? (
        <Typography sx={cardStyles.empty}>{t('empty')}</Typography>
      ) : showTable ? (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('day')}</TableCell>
              {seriesKeys.map((key) => (
                <TableCell key={key} sx={overviewStyles.tableNumber}>
                  {t(`series.${key}`)}
                </TableCell>
              ))}
              <TableCell sx={overviewStyles.tableNumber}>{t('total')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell>{row.label}</TableCell>
                {seriesKeys.map((key) => (
                  <TableCell key={key} sx={overviewStyles.tableNumber}>
                    {row[key]}
                  </TableCell>
                ))}
                <TableCell sx={overviewStyles.tableNumber}>
                  {row.approved + row.rejected + row.redo}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <BarChart
          dataset={rows}
          height={300}
          borderRadius={4}
          xAxis={[{ scaleType: 'band', dataKey: 'label' }]}
          series={seriesKeys.map((key) => ({
            dataKey: key,
            label: t(`series.${key}`),
            stack: 'total',
            color: chartSeriesColor[key],
          }))}
          margin={{ top: 56, right: 8, left: 32, bottom: 28 }}
          slotProps={{
            legend: {
              direction: 'row',
              position: { vertical: 'top', horizontal: 'left' },
              padding: 0,
              itemMarkWidth: 10,
              itemMarkHeight: 10,
              labelStyle: { fontSize: 13 },
            },
          }}
          sx={overviewStyles.chart}
        />
      )}
    </Box>
  )
}
