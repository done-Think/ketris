import { Chip } from '@mui/material'
import { useTranslations } from 'next-intl'

import { getChargeStatusChipStyles } from '../styles/charge-status-chip.styles'
import type { ChargeStatusChipProps } from '../types/charge'

export function ChargeStatusChip({ status }: ChargeStatusChipProps) {
  const t = useTranslations('charges.statuses')

  return <Chip label={t(status)} size="small" sx={getChargeStatusChipStyles(status)} />
}
