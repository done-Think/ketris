'use client'

import { useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { useEditContract } from '../../hooks/use-contracts'
import { createContractSchema } from '../../schemas/create-contract-schema'
import { contractEditValues, buildEditContractPayload } from '../../utils/contract-edit-values'
import { contractError } from '../../utils/contract-error'
import type { CreateContractFormValues } from '../../types/contract'
import type { ContractEditDialogProps } from '../../types/workflow'
import { PartiesStep } from '../contract-step-fields/PartiesStep'
import { ConditionsStep } from '../contract-step-fields/ConditionsStep'

export function ContractEditDialog({ contract, tenantId, onClose }: ContractEditDialogProps) {
  const t = useTranslations('contracts.edit')
  const validation = useTranslations('contracts.wizard.errors')
  const errors = useTranslations('contracts.errors')
  const schema = useMemo(() => createContractSchema(validation), [validation])
  const { control, setValue, handleSubmit } = useForm<CreateContractFormValues>({
    resolver: zodResolver(schema),
    defaultValues: contractEditValues(contract),
    mode: 'onBlur',
  })
  const mutation = useEditContract(tenantId, contract.id)
  const submit = handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync(buildEditContractPayload(values))
      onClose()
    } catch {
      /* Erro visível no diálogo. */
    }
  })
  return (
    <Dialog open fullWidth maxWidth="md" onClose={mutation.isPending ? undefined : onClose}>
      <DialogTitle>{t('title')}</DialogTitle>
      <DialogContent>
        <Stack component="form" id="contract-edit-form" onSubmit={submit} spacing={3}>
          <Alert severity="info">{t('notice')}</Alert>
          <PartiesStep control={control} setValue={setValue} />
          <ConditionsStep control={control} />
          {mutation.isError && (
            <Alert severity="error">{contractError(mutation.error, errors)}</Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={mutation.isPending} onClick={onClose}>
          {t('back')}
        </Button>
        <Button
          form="contract-edit-form"
          type="submit"
          variant="contained"
          disabled={mutation.isPending}
        >
          {t('save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
