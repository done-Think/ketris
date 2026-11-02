'use client'

import { Box, Typography } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'

import type { DiagnosticLimit, EvidenceDiagnosticsProps } from '../../../types/console.types'
import { diagnosticRows } from '../../../utils/evidence-diagnostics'
import { diagnosticsStyles as styles } from '../../../styles/console.styles'

export function EvidenceDiagnostics({ evidence }: EvidenceDiagnosticsProps) {
  const t = useTranslations('face_check.console.detail.evidence.diagnostics')
  const format = useFormatter()
  const rows = diagnosticRows(evidence)
  if (!rows.length) return null

  const number = (value: number) => format.number(value, { maximumFractionDigits: 3 })
  const limitText = (limit: DiagnosticLimit | null) => {
    if (!limit) return ''
    if (limit.kind === 'range')
      return t('limits.range', { min: number(limit.min), max: number(limit.max) })
    return t(`limits.${limit.kind}`, { value: number(limit.value) })
  }

  return (
    <Box component="dl" aria-label={t('title')} sx={styles.list}>
      {rows.map((row) => (
        <Box key={row.key} sx={styles.row}>
          <Typography component="dt" sx={styles.label}>
            {t(`rows.${row.key}`)}
          </Typography>
          <Typography component="dd" sx={styles.value(row.passed)}>
            {t('value', { value: number(row.value), limit: limitText(row.limit) })}
            {row.passed === false ? ` · ${t('failed')}` : ''}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}
