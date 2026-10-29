'use client'

import {
  infoRowSx,
  infoLabelSx,
  infoValueSx,
  styles,
} from '../../styles/contract-info-panel.styles'
import { Link as MuiLink, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { ContractInfoPanelProps } from '../../types/detail'
import { ContractDetailPanel } from './ContractDetailPanel'

export function ContractInfoPanel({ contract }: ContractInfoPanelProps) {
  const t = useTranslations('contracts.detail')
  const rows = [
    { label: t('tenant'), value: contract.tenant },
    { label: t('amount'), value: contract.amount },
    { label: t('adjustment'), value: contract.adjustment },
    { label: t('start'), value: contract.startDate },
    { label: t('end'), value: contract.endDate },
    { label: t('payment'), value: contract.paymentDay },
    { label: t('guarantee'), value: contract.guarantee },
  ]

  return (
    <ContractDetailPanel title={t('info')} sx={styles.contractDetailPanel}>
      <Stack sx={styles.stack}>
        <Stack direction="row" justifyContent="space-between" spacing={2} sx={infoRowSx}>
          <Typography sx={infoLabelSx}>{t('property')}</Typography>
          <MuiLink
            component={Link}
            href={{ pathname: '/dashboard/properties/[id]', params: { id: contract.propertyId } }}
            underline="hover"
            sx={styles.muiLink}
          >
            {contract.property}
          </MuiLink>
        </Stack>
        {rows.map((row) => (
          <Stack
            key={row.label}
            direction="row"
            justifyContent="space-between"
            spacing={2}
            sx={infoRowSx}
          >
            <Typography sx={infoLabelSx}>{row.label}</Typography>
            <Typography sx={infoValueSx}>{row.value}</Typography>
          </Stack>
        ))}
      </Stack>
    </ContractDetailPanel>
  )
}
