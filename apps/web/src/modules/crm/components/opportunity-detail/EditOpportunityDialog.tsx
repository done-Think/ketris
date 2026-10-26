import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import * as crmStyles from '../../styles/edit-opportunity-dialog.styles'
import { OpportunityTermsFields } from './OpportunityTermsFields'

import { createEditOpportunityFormSchema } from '../../schemas/opportunity-schema'
import type { OpportunityEditFormValues } from '../../types/opportunity'
import type { EditOpportunityDialogProps } from '../../types/opportunity-detail'

const emptyEditOpportunityValues: OpportunityEditFormValues = {
  contact: null,
  leadName: '',
  leadEmail: '',
  leadPhone: '',
  proposedValue: '',
  contractTermMonths: '',
  desiredStartDate: '',
  guaranteeType: 'NENHUMA',
  specialConditions: [],
  notes: '',
}

export function EditOpportunityDialog(props: EditOpportunityDialogProps) {
  return props.open ? <EditOpportunityDialogForm {...props} /> : null
}

function EditOpportunityDialogForm({
  open,
  initialValues,
  isPending,
  onClose,
  onSave,
}: EditOpportunityDialogProps) {
  const t = useTranslations('crm.opportunityDetail')
  const editOpportunityFormSchema = useMemo(
    () => createEditOpportunityFormSchema((key) => t(`errors.${key}`)),
    [t],
  )
  const form = useForm<OpportunityEditFormValues>({
    defaultValues: initialValues ?? emptyEditOpportunityValues,
    resolver: zodResolver(editOpportunityFormSchema),
  })
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = form

  return (
    <FormProvider {...form}>
      <Dialog open={open} onClose={() => !isPending && onClose()} fullWidth maxWidth="sm">
        <Box component="form" noValidate onSubmit={handleSubmit(onSave)}>
          <DialogTitle sx={crmStyles.dialogTitleSx}>{t('editTitle')}</DialogTitle>
          <DialogContent>
            {initialValues && (
              <Box sx={crmStyles.boxSx}>
                <TextField
                  label={t('fields.name')}
                  required
                  error={Boolean(errors.leadName)}
                  helperText={errors.leadName?.message}
                  {...register('leadName')}
                />
                <TextField
                  label={t('fields.email')}
                  type="email"
                  required
                  error={Boolean(errors.leadEmail)}
                  helperText={errors.leadEmail?.message}
                  {...register('leadEmail')}
                />
                <TextField
                  label={t('fields.phone')}
                  error={Boolean(errors.leadPhone)}
                  helperText={errors.leadPhone?.message}
                  {...register('leadPhone')}
                />
                <TextField
                  label={t('fields.proposedValue')}
                  type="number"
                  required
                  slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                  error={Boolean(errors.proposedValue)}
                  helperText={errors.proposedValue?.message}
                  {...register('proposedValue')}
                />
                <OpportunityTermsFields />
                <TextField
                  label={t('fields.notes')}
                  multiline
                  minRows={3}
                  error={Boolean(errors.notes)}
                  helperText={errors.notes?.message}
                  sx={crmStyles.textFieldSx}
                  {...register('notes')}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button disabled={isPending} onClick={onClose}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit" variant="contained" disabled={isPending || !initialValues}>
              {isPending ? <CircularProgress size={20} /> : t('actions.saveChanges')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </FormProvider>
  )
}
