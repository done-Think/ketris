'use client'

import { contractStatusMessageKeys } from '../../config/contract-labels'

import { styles } from '../../styles/contract-detail-header.styles'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { contractStatusStyles } from '../../styles/contract-status.styles'
import type { ContractDetailHeaderProps } from '../../types/detail'
import { formatContractCode } from '../../utils/format-contract-code'

export function ContractDetailHeader({
  contract,
  readOnly,
  canEdit,
  canCancel,
  canClose,
  busy,
  onEdit,
  onCancel,
  onClose,
}: ContractDetailHeaderProps) {
  const t = useTranslations('contracts.detail')
  const status = useTranslations('contracts.status')
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', md: 'center' }}
      spacing={2}
      sx={styles.stack}
    >
      <Box sx={styles.box}>
        <Stack direction="row" alignItems="center" spacing={1.6} sx={styles.stack2}>
          <Typography variant="h1" sx={styles.typography}>
            {t('title', { code: formatContractCode(contract.code) })}
          </Typography>
          <Chip
            label={status(contractStatusMessageKeys[contract.status])}
            sx={styles.chip(contractStatusStyles[contract.status])}
          />
        </Stack>
      </Box>
      {!readOnly && (
        <Stack direction="row" spacing={1.1} sx={styles.stack3}>
          {canEdit && (
            <Button
              variant="outlined"
              color="secondary"
              disabled={busy}
              onClick={onEdit}
              startIcon={<EditOutlinedIcon />}
            >
              {t('edit')}
            </Button>
          )}
          {canCancel && (
            <Button variant="outlined" sx={styles.button} disabled={busy} onClick={onCancel}>
              {t('cancel')}
            </Button>
          )}
          {canClose && (
            <Button variant="outlined" sx={styles.button} disabled={busy} onClick={onClose}>
              {t('close')}
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  )
}
