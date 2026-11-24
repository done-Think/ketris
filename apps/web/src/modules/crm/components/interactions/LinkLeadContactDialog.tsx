'use client'

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
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useContactLink } from '../../hooks/use-contact-link'
import { createContactLinkSchema } from '../../schemas/contact-link-schema'
import type {
  LinkContactFormValues,
  LinkLeadContactDialogProps,
  LinkLeadContactFormProps,
} from '../../types/contact-link'
import type { ContactFormValues } from '../../types/contact'
import { ContactPicker } from '../ContactPicker'
import { ContactFormDialog } from '../contacts-list/ContactFormDialog'

export function LinkLeadContactDialog(props: LinkLeadContactDialogProps) {
  return props.lead ? (
    <LinkForm key={props.lead.id} lead={props.lead} onClose={props.onClose} />
  ) : null
}
function LinkForm({ lead, onClose }: LinkLeadContactFormProps) {
  const t = useTranslations('crm.contactLinks')
  const [creating, setCreating] = useState(false)
  const mutation = useContactLink(lead.id)
  const schema = useMemo(() => createContactLinkSchema(t('required')), [t])
  const { control, handleSubmit } = useForm<LinkContactFormValues>({
    resolver: zodResolver(schema),
  })
  async function create(values: ContactFormValues) {
    try {
      await mutation.mutateAsync({
        contact: { ...values, phone: values.phone || null, notes: values.notes || null },
      })
      onClose()
    } catch {
      return
    }
  }
  return (
    <>
      <Dialog
        open={!creating}
        onClose={() => !mutation.isPending && onClose()}
        fullWidth
        maxWidth="sm"
      >
        <Stack
          component="form"
          onSubmit={handleSubmit(async (values) => {
            try {
              await mutation.mutateAsync({ contactId: values.contact.id })
              onClose()
            } catch {
              return
            }
          })}
        >
          <DialogTitle>{t('title', { name: lead.name })}</DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              <Alert severity="info">{t('explanation')}</Alert>
              <Controller
                control={control}
                name="contact"
                render={({ field, fieldState }) => (
                  <ContactPicker
                    value={field.value ?? null}
                    onChange={field.onChange}
                    label={t('existing')}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              {mutation.isError && <Alert severity="error">{t('error')}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} disabled={mutation.isPending}>
              {t('cancel')}
            </Button>
            <Button
              onClick={() => {
                mutation.reset()
                setCreating(true)
              }}
              disabled={mutation.isPending}
            >
              {t('create')}
            </Button>
            <Button type="submit" variant="contained" disabled={mutation.isPending}>
              {t('link')}
            </Button>
          </DialogActions>
        </Stack>
      </Dialog>
      {creating && (
        <>
          <ContactFormDialog
            errorMessage={mutation.isError ? t('error') : undefined}
            title={t('create')}
            open
            initialValues={{
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              type: 'RENTER',
              notes: '',
            }}
            isPending={mutation.isPending}
            onClose={() => {
              mutation.reset()
              setCreating(false)
            }}
            onSave={create}
          />
        </>
      )}
    </>
  )
}
