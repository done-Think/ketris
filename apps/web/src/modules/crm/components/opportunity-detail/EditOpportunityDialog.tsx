import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'

import { editOpportunityFormSchema } from '../../schemas/opportunity-schema'
import type { Opportunity, OpportunityEditFormValues } from '../../types/opportunity'
import type { EditOpportunityDialogProps } from '../../types/opportunity-detail'

const emptyEditOpportunityValues: OpportunityEditFormValues = {
  leadName: '',
  leadEmail: '',
  leadPhone: '',
  proposedValue: '',
  contractTermMonths: '',
  desiredStartDate: '',
  guaranteeType: 'NENHUMA',
  specialConditions: '',
  notes: '',
}

export function EditOpportunityDialog({
  open,
  initialValues,
  isPending,
  onClose,
  onSave,
}: EditOpportunityDialogProps) {
  const t = useTranslations('crm.opportunityDetail')
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<OpportunityEditFormValues>({
    defaultValues: emptyEditOpportunityValues,
    resolver: zodResolver(editOpportunityFormSchema),
  })

  useEffect(() => {
    if (open && initialValues) reset(initialValues)
  }, [initialValues, open, reset])

  return (
    <Dialog open={open} onClose={() => !isPending && onClose()} fullWidth maxWidth="sm">
      <Box component="form" noValidate onSubmit={handleSubmit(onSave)}>
        <DialogTitle sx={{ letterSpacing: 0 }}>{t('editTitle')}</DialogTitle>
        <DialogContent>
          {initialValues && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                gap: 2,
                pt: 1,
              }}
            >
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
                slotProps={{ htmlInput: { min: 0, step: 100 } }}
                error={Boolean(errors.proposedValue)}
                helperText={errors.proposedValue?.message}
                {...register('proposedValue')}
              />
              <TextField
                label={t('fields.contractTerm')}
                type="number"
                slotProps={{ htmlInput: { min: 1, step: 1 } }}
                error={Boolean(errors.contractTermMonths)}
                helperText={errors.contractTermMonths?.message}
                {...register('contractTermMonths')}
              />
              <TextField
                label={t('fields.intendedStart')}
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                error={Boolean(errors.desiredStartDate)}
                helperText={errors.desiredStartDate?.message}
                {...register('desiredStartDate')}
              />
              <Controller
                control={control}
                name="guaranteeType"
                render={({ field }) => (
                  <FormControl error={Boolean(errors.guaranteeType)}>
                    <InputLabel id="guarantee-label">{t('fields.guarantee')}</InputLabel>
                    <Select
                      labelId="guarantee-label"
                      label={t('fields.guarantee')}
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(event.target.value as Opportunity['guaranteeType'])
                      }
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                    >
                      <MenuItem value="NENHUMA">{t('guarantees.NENHUMA')}</MenuItem>
                      <MenuItem value="FIADOR">{t('guarantees.FIADOR')}</MenuItem>
                      <MenuItem value="CAUCAO">{t('guarantees.CAUCAO')}</MenuItem>
                      <MenuItem value="SEGURO_FIANCA">{t('guarantees.SEGURO_FIANCA')}</MenuItem>
                    </Select>
                    {errors.guaranteeType?.message && (
                      <FormHelperText>{errors.guaranteeType.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
              <TextField
                label={t('fields.specialConditions')}
                helperText={
                  errors.specialConditions?.message ?? t('fields.specialConditionsHelper')
                }
                error={Boolean(errors.specialConditions)}
                {...register('specialConditions')}
              />
              <TextField
                label={t('fields.notes')}
                multiline
                minRows={3}
                error={Boolean(errors.notes)}
                helperText={errors.notes?.message}
                sx={{ gridColumn: { sm: '1 / -1' } }}
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
  )
}
