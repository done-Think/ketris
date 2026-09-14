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
  interessadoNome: '',
  interessadoEmail: '',
  interessadoTelefone: '',
  valorProposto: '',
  prazoContratoMeses: '',
  inicioPretendido: '',
  garantiaContratual: 'NENHUMA',
  condicoesEspeciais: '',
  observacoes: '',
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
                error={Boolean(errors.interessadoNome)}
                helperText={errors.interessadoNome?.message}
                {...register('interessadoNome')}
              />
              <TextField
                label={t('fields.email')}
                type="email"
                required
                error={Boolean(errors.interessadoEmail)}
                helperText={errors.interessadoEmail?.message}
                {...register('interessadoEmail')}
              />
              <TextField
                label={t('fields.phone')}
                error={Boolean(errors.interessadoTelefone)}
                helperText={errors.interessadoTelefone?.message}
                {...register('interessadoTelefone')}
              />
              <TextField
                label={t('fields.proposedValue')}
                type="number"
                required
                slotProps={{ htmlInput: { min: 0, step: 100 } }}
                error={Boolean(errors.valorProposto)}
                helperText={errors.valorProposto?.message}
                {...register('valorProposto')}
              />
              <TextField
                label={t('fields.contractTerm')}
                type="number"
                slotProps={{ htmlInput: { min: 1, step: 1 } }}
                error={Boolean(errors.prazoContratoMeses)}
                helperText={errors.prazoContratoMeses?.message}
                {...register('prazoContratoMeses')}
              />
              <TextField
                label={t('fields.intendedStart')}
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                error={Boolean(errors.inicioPretendido)}
                helperText={errors.inicioPretendido?.message}
                {...register('inicioPretendido')}
              />
              <Controller
                control={control}
                name="garantiaContratual"
                render={({ field }) => (
                  <FormControl error={Boolean(errors.garantiaContratual)}>
                    <InputLabel id="guarantee-label">{t('fields.guarantee')}</InputLabel>
                    <Select
                      labelId="guarantee-label"
                      label={t('fields.guarantee')}
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(event.target.value as Opportunity['garantiaContratual'])
                      }
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                    >
                      <MenuItem value="NENHUMA">{t('guarantees.NENHUMA')}</MenuItem>
                      <MenuItem value="FIADOR">{t('guarantees.FIADOR')}</MenuItem>
                      <MenuItem value="CAUCAO">{t('guarantees.CAUCAO')}</MenuItem>
                      <MenuItem value="SEGURO_FIANCA">{t('guarantees.SEGURO_FIANCA')}</MenuItem>
                    </Select>
                    {errors.garantiaContratual?.message && (
                      <FormHelperText>{errors.garantiaContratual.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
              <TextField
                label={t('fields.specialConditions')}
                helperText={
                  errors.condicoesEspeciais?.message ?? t('fields.specialConditionsHelper')
                }
                error={Boolean(errors.condicoesEspeciais)}
                {...register('condicoesEspeciais')}
              />
              <TextField
                label={t('fields.notes')}
                multiline
                minRows={3}
                error={Boolean(errors.observacoes)}
                helperText={errors.observacoes?.message}
                sx={{ gridColumn: { sm: '1 / -1' } }}
                {...register('observacoes')}
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
