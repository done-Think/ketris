'use client'

import { styles } from '../styles/contracts-create-page.styles'
import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link as MuiLink,
  Stack,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { useForm } from 'react-hook-form'
import { Link, useRouter } from '@/i18n/navigation'
import { createContractSteps } from '../config/contract-ui'
import {
  createContractDefaultValues,
  createContractSchema,
} from '../schemas/create-contract-schema'
import { useContractWizard } from '../hooks/use-contract-wizard'
import { useCreateContract } from '../hooks/use-contracts'
import type { CreateContractFormValues } from '../types/contract'
import { contractError } from '../utils/contract-error'
import { ContractActions } from './ContractActions'
import { ContractStepFields } from './ContractStepFields'
import { stepValidationFields } from '../config/contract-fields'
import { ContractStepsNav } from './ContractStepsNav'

export function ContractsCreatePage() {
  const t = useTranslations('contracts.wizard')
  const errors = useTranslations('contracts.errors')
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const createContractMutation = useCreateContract()
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false)
  const contractSchema = useMemo(() => createContractSchema((key) => t(`errors.${key}`)), [t])
  const {
    control,
    formState: { isDirty },
    handleSubmit,
    setValue,
    trigger,
  } = useForm<CreateContractFormValues>({
    defaultValues: createContractDefaultValues,
    resolver: zodResolver(contractSchema),
    mode: 'onBlur',
  })

  const wizard = useContractWizard()
  const { activeStepIndex, maxStepIndex } = wizard
  const activeStep = createContractSteps[activeStepIndex]
  const firstStep = activeStepIndex === 0
  const lastStep = activeStepIndex === createContractSteps.length - 1
  const createContract = async (formValues: CreateContractFormValues) => {
    try {
      const contract = await createContractMutation.mutateAsync(formValues)

      enqueueSnackbar(t('successMessage', { code: contract.code }), { variant: 'success' })
      router.push('/dashboard/contracts')
    } catch (error) {
      enqueueSnackbar(contractError(error, errors), { variant: 'error' })
    }
  }

  const goToPreviousStep = () => {
    if (firstStep) {
      if (isDirty) {
        setDiscardDialogOpen(true)
        return
      }

      router.push('/dashboard/contracts')
      return
    }

    wizard.previous()
  }

  const goToNextStep = async () => {
    if (lastStep) {
      await handleSubmit(createContract)()
      return
    }

    const validStep = await trigger(stepValidationFields[activeStepIndex], { shouldFocus: true })
    if (!validStep) return

    wizard.next()
  }

  const goToStep = wizard.select

  return (
    <Box sx={styles.box}>
      <Box sx={styles.box2}>
        <Stack spacing={0.7} sx={styles.stack}>
          <Stack direction="row" alignItems="center" spacing={0.8}>
            <MuiLink
              component={Link}
              href="/dashboard/contracts"
              underline="hover"
              sx={styles.muiLink}
            >
              {t('breadcrumbContracts')}
            </MuiLink>
            <Typography sx={styles.typography}>›</Typography>
            <Typography sx={styles.typography2}>{t('breadcrumbNew')}</Typography>
          </Stack>
          <Typography variant="h3" sx={styles.typography3}>
            {t('title')}
          </Typography>
        </Stack>

        <ContractStepsNav
          activeStepIndex={activeStepIndex}
          maxStepIndex={maxStepIndex}
          onStepSelect={goToStep}
        />

        <Box component="form" onSubmit={handleSubmit(createContract)} sx={styles.box3}>
          <Typography sx={styles.typography4}>
            {activeStep.key === 'review'
              ? t('stepFormTitleReview')
              : t('stepFormTitle', { step: t(`steps.${activeStep.key}`) })}
          </Typography>

          <ContractStepFields
            activeStepKey={activeStep.key}
            control={control}
            setValue={setValue}
          />
        </Box>

        <ContractActions
          lastStep={lastStep}
          isSubmitting={createContractMutation.isPending}
          onPreviousStep={goToPreviousStep}
          onNextStep={goToNextStep}
        />
      </Box>

      <Dialog open={discardDialogOpen} onClose={() => setDiscardDialogOpen(false)}>
        <DialogTitle sx={styles.dialogTitle}>{t('discardDialog.title')}</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">{t('discardDialog.description')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiscardDialogOpen(false)}>{t('discardDialog.cancel')}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              setDiscardDialogOpen(false)
              router.push('/dashboard/contracts')
            }}
          >
            {t('discardDialog.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
