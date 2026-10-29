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
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form'
import * as crmStyles from '../../styles/create-opportunity-dialog.styles'
import { OpportunityTermsFields } from './OpportunityTermsFields'

import { createOpportunityFormSchema } from '../../schemas/opportunity-schema'
import type { CreateOpportunityFormValues } from '../../types/opportunity'
import type { CreateOpportunityDialogProps } from '../../types/opportunity-detail'
import { useCrmResponsibles } from '../../hooks/use-opportunities'
import { PropertyAutocomplete } from './PropertyAutocomplete'

const emptyCreateOpportunityValues: CreateOpportunityFormValues = {
  property: null,
  contractTermMonths: '',
  desiredStartDate: '',
  guaranteeType: 'NONE',
  specialConditions: [],
  contact: null,
  leadName: '',
  leadEmail: '',
  leadPhone: '',
  proposedValue: '',
  notes: '',
  status: 'DRAFT',
  responsibleId: '',
}

export function CreateOpportunityDialog(props: CreateOpportunityDialogProps) {
  return props.open ? <CreateOpportunityDialogForm {...props} /> : null
}

function CreateOpportunityDialogForm({
  open,
  canChooseResponsible,
  isPending,
  onClose,
  onSave,
}: CreateOpportunityDialogProps) {
  const t = useTranslations('crm.opportunityDetail')
  const responsibles = useCrmResponsibles(canChooseResponsible)
  const opportunityFormSchema = useMemo(
    () => createOpportunityFormSchema((key) => t(`errors.${key}`)),
    [t],
  )
  const form = useForm<CreateOpportunityFormValues>({
    defaultValues: emptyCreateOpportunityValues,
    resolver: zodResolver(opportunityFormSchema),
  })
  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = form

  const selectedContact = useWatch({ control, name: 'contact' })
  return (
    <FormProvider {...form}>
      <Dialog open={open} onClose={() => !isPending && onClose()} fullWidth maxWidth="sm">
        <Box component="form" noValidate onSubmit={handleSubmit(onSave)}>
          <DialogTitle sx={crmStyles.dialogTitleSx}>{t('createTitle')}</DialogTitle>
          <DialogContent>
            <Box sx={crmStyles.boxSx}>
              <Controller
                control={control}
                name="property"
                render={({ field }) => (
                  <Box sx={crmStyles.boxSx2}>
                    <PropertyAutocomplete
                      value={field.value}
                      onChange={field.onChange}
                      error={Boolean(errors.property)}
                      helperText={errors.property?.message}
                    />
                  </Box>
                )}
              />
              <TextField
                label={t('fields.name')}
                disabled={Boolean(selectedContact)}
                required
                error={Boolean(errors.leadName)}
                helperText={errors.leadName?.message}
                {...register('leadName')}
              />
              <TextField
                label={t('fields.email')}
                disabled={Boolean(selectedContact)}
                type="email"
                required
                error={Boolean(errors.leadEmail)}
                helperText={errors.leadEmail?.message}
                {...register('leadEmail')}
              />
              <TextField
                label={t('fields.phone')}
                disabled={Boolean(selectedContact)}
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
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <FormControl>
                    <InputLabel id="create-opportunity-status-label">
                      {t('fields.status')}
                    </InputLabel>
                    <Select
                      labelId="create-opportunity-status-label"
                      label={t('fields.status')}
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(event.target.value as CreateOpportunityFormValues['status'])
                      }
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                    >
                      <MenuItem value="DRAFT">{t('statuses.draft')}</MenuItem>
                      <MenuItem value="SENT">{t('statuses.sent')}</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
              {canChooseResponsible && responsibles.data?.length ? (
                <Controller
                  control={control}
                  name="responsibleId"
                  render={({ field }) => (
                    <TextField
                      select
                      label={t('responsible.label')}
                      helperText={t('responsible.createHelper')}
                      slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                    >
                      <MenuItem value="">{t('responsible.me')}</MenuItem>
                      {responsibles.data.map((option) => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              ) : null}
              <OpportunityTermsFields />
              <TextField
                label={t('fields.notes')}
                multiline
                minRows={3}
                error={Boolean(errors.notes)}
                helperText={errors.notes?.message}
                sx={crmStyles.boxSx2}
                {...register('notes')}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button disabled={isPending} onClick={onClose}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit" variant="contained" disabled={isPending}>
              {isPending ? <CircularProgress size={20} /> : t('actions.createOpportunity')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </FormProvider>
  )
}
