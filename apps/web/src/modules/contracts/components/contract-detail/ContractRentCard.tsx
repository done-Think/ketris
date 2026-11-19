'use client'

import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { styles } from '../../styles/contract-detail-tabs.styles'
import type { ContractRentCardProps } from '../../types/detail'

export function ContractRentCard({ amount, dueDay }: ContractRentCardProps) {
  const t = useTranslations('contracts.detail')
  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={styles.rentCard}>
      <Box sx={styles.rentIcon}>
        <HomeWorkOutlinedIcon />
      </Box>
      <Box sx={styles.rentText}>
        <Typography sx={styles.rentLabel}>{t('rentDue', { day: dueDay })}</Typography>
        <Typography sx={styles.rentValue}>{amount}</Typography>
      </Box>
    </Stack>
  )
}
