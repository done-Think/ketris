'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Link as MuiLink, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { useForm } from 'react-hook-form'

import { Link, useRouter } from '@/i18n/navigation'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import { createContractSteps } from '../config/contract-ui'
import {
  createContractDefaultValues,
  createContractSchema,
} from '../schemas/create-contract-schema'
import { useContractsStore } from '../stores/contracts-store'
import type { CreateContractFieldName, CreateContractFormValues } from '../types/contract'
import { ContractActions } from './ContractActions'
import { ContractStepFields } from './ContractStepFields'
import { ContractStepsNav } from './ContractStepsNav'

const stepValidationFields: Record<number, CreateContractFieldName[]> = {
  0: [
    'ownerName',
    'ownerCpf',
    'ownerEmail',
    'ownerPhone',
    'tenantName',
    'tenantCpf',
    'tenantEmail',
    'tenantPhone',
    'hasGuarantor',
    'guarantorName',
    'guarantorCpf',
    'guarantorEmail',
    'guarantorPhone',
  ],
  1: [
    'propertyTitle',
    'propertyAddress',
    'propertyZipCode',
    'propertyCity',
    'propertyState',
    'propertyType',
    'propertyRegistration',
    'propertyArea',
  ],
  2: [
    'contractType',
    'monthlyRent',
    'condominiumFee',
    'iptu',
    'dueDay',
    'startDate',
    'endDate',
    'guaranteeType',
    'adjustmentIndex',
  ],
  3: [],
}

export function ContractsCreatePage() {
  const t = useTranslations('contracts.wizard')
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const addContract = useContractsStore((state) => state.addContract)
  const { control, handleSubmit, setValue, trigger, watch } = useForm<CreateContractFormValues>({
    defaultValues: createContractDefaultValues,
    resolver: zodResolver(createContractSchema),
    mode: 'onBlur',
  })

  const values = watch()
  const activeStepIndex = values.activeStepIndex
  const maxStepIndex = values.maxStepIndex
  const activeStep = createContractSteps[activeStepIndex]
  const firstStep = activeStepIndex === 0
  const lastStep = activeStepIndex === createContractSteps.length - 1
  const createContract = (formValues: CreateContractFormValues) => {
    const contract = addContract(formValues)

    enqueueSnackbar(t('successMessage', { code: contract.code }), { variant: 'success' })
    router.push('/dashboard/contracts')
  }

  const goToPreviousStep = () => {
    if (firstStep) {
      router.push('/dashboard/contracts')
      return
    }

    setValue('activeStepIndex', Math.max(activeStepIndex - 1, 0), { shouldDirty: true })
  }

  const goToNextStep = async () => {
    if (lastStep) {
      await handleSubmit(createContract)()
      return
    }

    const validStep = await trigger(stepValidationFields[activeStepIndex], { shouldFocus: true })
    if (!validStep) return

    const nextStepIndex = Math.min(activeStepIndex + 1, createContractSteps.length - 1)

    setValue('activeStepIndex', nextStepIndex, { shouldDirty: true })
    setValue('maxStepIndex', Math.max(maxStepIndex, nextStepIndex), { shouldDirty: true })
  }

  const goToStep = (stepIndex: number) => {
    if (stepIndex > maxStepIndex) return

    setValue('activeStepIndex', stepIndex, { shouldDirty: true })
  }

  return (
    <Box
      sx={{
        width: '100%',
        px: { xs: 2, md: 4.8, xl: 6.4 },
        py: { xs: 2.8, md: 4.2 },
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 1540, mx: 'auto' }}>
        <Stack spacing={0.7} sx={{ mb: { xs: 3, md: 4.5 } }}>
          <Stack direction="row" alignItems="center" spacing={0.8}>
            <MuiLink
              component={Link}
              href="/dashboard/contracts"
              underline="hover"
              sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 700 }}
            >
              {t('breadcrumbContracts')}
            </MuiLink>
            <Typography sx={{ color: brand.neutral[400], fontSize: 12 }}>›</Typography>
            <Typography sx={{ color: brand.magenta[500], fontSize: 12, fontWeight: 900 }}>
              {t('breadcrumbNew')}
            </Typography>
          </Stack>
          <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 36 }, fontWeight: 900 }}>
            {t('title')}
          </Typography>
        </Stack>

        <ContractStepsNav
          activeStepIndex={activeStepIndex}
          maxStepIndex={maxStepIndex}
          onStepSelect={goToStep}
        />

        <Box
          component="form"
          onSubmit={handleSubmit(createContract)}
          sx={{
            bgcolor: surface.paper,
            border: '1px solid',
            borderColor: alpha.graphite[6],
            borderRadius: `${radius.sm}px`,
            boxShadow: shadows.propertyCard,
            px: { xs: 2, md: 3.6, xl: 4.4 },
            py: { xs: 2.6, md: 3.4, xl: 4 },
          }}
        >
          <Typography sx={{ color: brand.graphite[500], fontSize: 20, fontWeight: 900, mb: 2.4 }}>
            {activeStep.key === 'review'
              ? t('stepFormTitleReview')
              : t('stepFormTitle', { step: t(`steps.${activeStep.key}`) })}
          </Typography>

          <ContractStepFields
            activeStepKey={activeStep.key}
            control={control}
            setValue={setValue}
            values={values}
          />
        </Box>

        <ContractActions
          lastStep={lastStep}
          onPreviousStep={goToPreviousStep}
          onNextStep={goToNextStep}
        />
      </Box>
    </Box>
  )
}
