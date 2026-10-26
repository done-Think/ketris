import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import BlockRoundedIcon from '@mui/icons-material/BlockRounded'
import PaymentRoundedIcon from '@mui/icons-material/PaymentRounded'
import UndoRoundedIcon from '@mui/icons-material/UndoRounded'
import { Button, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { useRouter } from '@/i18n/navigation'

import { useFinancialFormat } from '../hooks/use-financial-format'
import { styles } from '../styles/charge-details.styles'
import type { ChargeDetailHeaderProps } from '../types/charge'
import { ChargeStatusChip } from './ChargeStatusChip'

export function ChargeDetailHeader({
  charge,
  canManage,
  onRegisterPayment,
  onReversePayment,
  onCancel,
}: ChargeDetailHeaderProps) {
  const t = useTranslations('charges.details')
  const format = useFinancialFormat()
  const router = useRouter()
  const subtitle = [
    t(`directions.${charge.direction}`),
    charge.property,
    format.month(charge.competence),
  ]
    .filter(Boolean)
    .join(' — ')

  return (
    <>
      <Button
        startIcon={<ArrowBackRoundedIcon />}
        color="secondary"
        onClick={() => router.push('/dashboard/finance/charges')}
        sx={styles.back}
      >
        {t('back')}
      </Button>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'center' }}
        spacing={1.5}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.2}
          useFlexGap
          flexWrap="wrap"
          sx={styles.titleRow}
        >
          <Typography component="h1" sx={styles.code}>
            {charge.code}
          </Typography>
          <Typography sx={styles.subtitle}>{subtitle}</Typography>
          <ChargeStatusChip status={charge.status} />
        </Stack>
        {canManage ? (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.1} sx={styles.actions}>
            {charge.open ? (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<BlockRoundedIcon />}
                onClick={onCancel}
              >
                {t('cancelCharge')}
              </Button>
            ) : null}
            {charge.status === 'paid' ? (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<UndoRoundedIcon />}
                onClick={onReversePayment}
              >
                {t('reversePayment')}
              </Button>
            ) : null}
            {charge.open ? (
              <Button
                variant="contained"
                startIcon={<PaymentRoundedIcon />}
                onClick={onRegisterPayment}
              >
                {t('registerPayment')}
              </Button>
            ) : null}
          </Stack>
        ) : null}
      </Stack>
    </>
  )
}
