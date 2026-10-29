'use client'

import type { TranslationKey } from '@/i18n/types/messages.types'

import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { useState } from 'react'

import { useRouter } from '@/i18n/navigation'
import { getApiErrorCode } from '@shared/utils/error-message'

import {
  useCancelCharge,
  useCharge,
  useRegisterChargePayment,
  useReverseChargePayment,
} from '../hooks/use-financial'
import { useFinancialError } from '../hooks/use-financial-error'
import { styles } from '../styles/charge-details.styles'
import type {
  ChargeDetailDialog,
  ChargeDetailsContentProps,
  ChargeDetailsPageProps,
  PaymentFormValues,
  ReasonFormValues,
} from '../types/charge'
import { ChargeDetailFields } from './ChargeDetailFields'
import { ChargeDetailHeader } from './ChargeDetailHeader'
import { ChargeHistoryCard } from './ChargeHistoryCard'
import { ChargeLinksCard } from './ChargeLinksCard'
import { ChargeReasonDialog } from './ChargeReasonDialog'
import { ChargeReceiptCard } from './ChargeReceiptCard'
import { RegisterPaymentDialog } from './RegisterPaymentDialog'

export function ChargeDetailsPage({ chargeId }: ChargeDetailsPageProps) {
  const t = useTranslations('charges.details')
  const router = useRouter()
  const chargeQuery = useCharge(chargeId)

  if (chargeQuery.isPending) {
    return (
      <Stack alignItems="center" sx={styles.centered}>
        <CircularProgress />
      </Stack>
    )
  }

  if (!chargeQuery.data) {
    const missing = getApiErrorCode(chargeQuery.error) === 'CHARGE_NOT_FOUND'

    return (
      <Stack spacing={2} sx={styles.missing}>
        <Typography>{t(missing ? 'missing' : 'loadFailed')}</Typography>
        <Stack direction="row" spacing={1}>
          {missing ? null : (
            <Button variant="contained" onClick={() => void chargeQuery.refetch()}>
              {t('retry')}
            </Button>
          )}
          <Button onClick={() => router.push('/dashboard/finance/charges')}>{t('back')}</Button>
        </Stack>
      </Stack>
    )
  }

  return <ChargeDetailsContent charge={chargeQuery.data} />
}

function ChargeDetailsContent({ charge }: ChargeDetailsContentProps) {
  const t = useTranslations('charges')
  const { enqueueSnackbar } = useSnackbar()
  const errorMessage = useFinancialError()
  const { data: session } = useSession()
  const isOwner = session?.role === 'OWNER'
  const [dialog, setDialog] = useState<ChargeDetailDialog | null>(null)
  const registerPayment = useRegisterChargePayment()
  const reversePayment = useReverseChargePayment()
  const cancelCharge = useCancelCharge()
  const feedback = (
    successKey: TranslationKey<'charges.feedback'>,
    fallbackKey: TranslationKey<'charges.errors'>,
  ) => ({
    onSuccess: () => {
      setDialog(null)
      enqueueSnackbar(t(`feedback.${successKey}`), { variant: 'success' })
    },
    onError: (error: unknown) =>
      enqueueSnackbar(errorMessage(error, fallbackKey), { variant: 'error' }),
  })

  return (
    <Box sx={styles.page}>
      <Stack spacing={2.2}>
        <ChargeDetailHeader
          charge={charge}
          canManage={isOwner}
          onRegisterPayment={() => setDialog('payment')}
          onReversePayment={() => setDialog('reverse')}
          onCancel={() => setDialog('cancel')}
        />
        <Box sx={styles.grid}>
          <Stack spacing={2.2}>
            <ChargeDetailFields charge={charge} />
            <ChargeReceiptCard charge={charge} />
          </Stack>
          <Stack spacing={2.2}>
            <ChargeLinksCard charge={charge} />
            {isOwner ? <ChargeHistoryCard chargeId={charge.id} /> : null}
          </Stack>
        </Box>
      </Stack>
      {isOwner ? (
        <>
          <RegisterPaymentDialog
            open={dialog === 'payment'}
            pending={registerPayment.isPending}
            onClose={() => setDialog(null)}
            onSubmit={(values: PaymentFormValues) =>
              registerPayment.mutate(
                { chargeId: charge.id, values },
                feedback('paymentRegistered', 'paymentFailed'),
              )
            }
          />
          <ChargeReasonDialog
            open={dialog === 'reverse' || dialog === 'cancel'}
            kind={dialog === 'reverse' ? 'reverse' : 'cancel'}
            pending={reversePayment.isPending || cancelCharge.isPending}
            onClose={() => setDialog(null)}
            onSubmit={(values: ReasonFormValues) =>
              dialog === 'reverse'
                ? reversePayment.mutate(
                    { chargeId: charge.id, values },
                    feedback('paymentReversed', 'reverseFailed'),
                  )
                : cancelCharge.mutate(
                    { chargeId: charge.id, values },
                    feedback('cancelled', 'cancelFailed'),
                  )
            }
          />
        </>
      ) : null}
    </Box>
  )
}
