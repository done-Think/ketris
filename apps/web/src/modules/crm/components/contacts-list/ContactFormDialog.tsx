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
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import * as crmStyles from '../../styles/contact-form-dialog.styles'

import { createContactFormSchema } from '../../schemas/contact-schema'
import type { ContactFormDialogProps, ContactFormValues } from '../../types/contact'

const emptyContactFormValues: ContactFormValues = {
  name: '',
  email: '',
  phone: '',
  type: 'LOCATARIO',
  notes: '',
}

export function ContactFormDialog(props: ContactFormDialogProps) {
  return props.open ? <ContactFormDialogForm {...props} /> : null
}

function ContactFormDialogForm({
  open,
  initialValues,
  isPending,
  onClose,
  onSave,
}: ContactFormDialogProps) {
  const t = useTranslations('crm.contacts.contactForm')
  const contactFormSchema = useMemo(() => createContactFormSchema((key) => t(`errors.${key}`)), [t])
  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<ContactFormValues>({
    defaultValues: initialValues ?? emptyContactFormValues,
    resolver: zodResolver(contactFormSchema),
  })

  return (
    <Dialog open={open} onClose={() => !isPending && onClose()} fullWidth maxWidth="sm">
      <Box component="form" noValidate onSubmit={handleSubmit(onSave)}>
        <DialogTitle sx={crmStyles.dialogTitleSx}>
          {initialValues ? t('editTitle') : t('createTitle')}
        </DialogTitle>
        <DialogContent>
          <Box sx={crmStyles.boxSx}>
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
              sx={crmStyles.textFieldSx}
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
