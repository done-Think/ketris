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
        <DialogTitle sx={{ letterSpacing: 0 }}>Editar oportunidade</DialogTitle>
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
                label="Nome"
                required
                error={Boolean(errors.interessadoNome)}
                helperText={errors.interessadoNome?.message}
                {...register('interessadoNome')}
              />
              <TextField
                label="E-mail"
                type="email"
                required
                error={Boolean(errors.interessadoEmail)}
                helperText={errors.interessadoEmail?.message}
                {...register('interessadoEmail')}
              />
              <TextField
                label="Telefone"
                error={Boolean(errors.interessadoTelefone)}
                helperText={errors.interessadoTelefone?.message}
                {...register('interessadoTelefone')}
              />
              <TextField
                label="Valor proposto"
                type="number"
                required
                inputProps={{ min: 0, step: 100 }}
                error={Boolean(errors.valorProposto)}
                helperText={errors.valorProposto?.message}
                {...register('valorProposto')}
              />
              <TextField
                label="Prazo do contrato (meses)"
                type="number"
                inputProps={{ min: 1, step: 1 }}
                error={Boolean(errors.prazoContratoMeses)}
                helperText={errors.prazoContratoMeses?.message}
                {...register('prazoContratoMeses')}
              />
              <TextField
                label="Início pretendido"
                type="date"
                InputLabelProps={{ shrink: true }}
                error={Boolean(errors.inicioPretendido)}
                helperText={errors.inicioPretendido?.message}
                {...register('inicioPretendido')}
              />
              <Controller
                control={control}
                name="garantiaContratual"
                render={({ field }) => (
                  <FormControl error={Boolean(errors.garantiaContratual)}>
                    <InputLabel id="guarantee-label">Garantia</InputLabel>
                    <Select
                      labelId="guarantee-label"
                      label="Garantia"
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(event.target.value as Opportunity['garantiaContratual'])
                      }
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                    >
                      <MenuItem value="NENHUMA">Não informada</MenuItem>
                      <MenuItem value="FIADOR">Fiador</MenuItem>
                      <MenuItem value="CAUCAO">Caução</MenuItem>
                      <MenuItem value="SEGURO_FIANCA">Seguro-fiança</MenuItem>
                    </Select>
                    {errors.garantiaContratual?.message && (
                      <FormHelperText>{errors.garantiaContratual.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
              <TextField
                label="Condições especiais"
                helperText={
                  errors.condicoesEspeciais?.message ?? 'Separe as condições por vírgulas.'
                }
                error={Boolean(errors.condicoesEspeciais)}
                {...register('condicoesEspeciais')}
              />
              <TextField
                label="Observações"
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
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isPending || !initialValues}>
            {isPending ? <CircularProgress size={20} /> : 'Salvar alterações'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
