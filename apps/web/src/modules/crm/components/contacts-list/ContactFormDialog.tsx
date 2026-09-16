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

import { contactFormSchema, type ContactFormValues } from '../../schemas/contact-schema'

const emptyContactFormValues: ContactFormValues = {
  name: '',
  email: '',
  phone: '',
  type: 'LOCATARIO',
  notes: '',
}

export interface ContactFormDialogProps {
  open: boolean
  /** null = criar (form vazio); preenchido = editar. */
  initialValues: ContactFormValues | null
  isPending: boolean
  onClose: () => void
  onSave: (values: ContactFormValues) => void
}

export function ContactFormDialog({
  open,
  initialValues,
  isPending,
  onClose,
  onSave,
}: ContactFormDialogProps) {
  const t = useTranslations('crm.contacts.contactForm')
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    defaultValues: emptyContactFormValues,
    resolver: zodResolver(contactFormSchema),
  })

  useEffect(() => {
    if (open) reset(initialValues ?? emptyContactFormValues)
  }, [initialValues, open, reset])

  return (
    <Dialog open={open} onClose={() => !isPending && onClose()} fullWidth maxWidth="sm">
      <Box component="form" noValidate onSubmit={handleSubmit(onSave)}>
        <DialogTitle sx={{ letterSpacing: 0 }}>
          {initialValues ? t('editTitle') : t('createTitle')}
        </DialogTitle>
        <DialogContent>
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
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
              {...register('name')}
            />
            <TextField
              label={t('fields.email')}
              type="email"
              required
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              {...register('email')}
            />
            <TextField
              label={t('fields.phone')}
              error={Boolean(errors.phone)}
              helperText={errors.phone?.message}
              {...register('phone')}
            />
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <FormControl error={Boolean(errors.type)}>
                  <InputLabel id="contact-type-label">{t('fields.type')}</InputLabel>
                  <Select
                    labelId="contact-type-label"
                    label={t('fields.type')}
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(event.target.value as ContactFormValues['type'])
                    }
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                  >
                    <MenuItem value="PROPRIETARIO">{t('types.PROPRIETARIO')}</MenuItem>
                    <MenuItem value="LOCATARIO">{t('types.LOCATARIO')}</MenuItem>
                    <MenuItem value="CORRETOR">{t('types.CORRETOR')}</MenuItem>
                  </Select>
                  {errors.type?.message && <FormHelperText>{errors.type.message}</FormHelperText>}
                </FormControl>
              )}
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
        </DialogContent>
        <DialogActions>
          <Button disabled={isPending} onClick={onClose}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? <CircularProgress size={20} /> : t('actions.save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
