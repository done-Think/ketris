'use client'

import { INTERACTION_NOTE_LIMIT } from '@server/crm/constants/interactions'

import { Alert, Button, MenuItem, Stack, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useCompleteInteraction } from '../../hooks/use-interactions'
import { createInteractionResultSchema } from '../../schemas/interaction-result-schema'
import type {
  InteractionResultFormProps,
  InteractionResultFormValues,
} from '../../types/interaction'

export function InteractionResultForm({ interaction, onCancel }: InteractionResultFormProps) {
  const t = useTranslations('crm.interactions')
  const complete = useCompleteInteraction(interaction.id)
  const schema = useMemo(() => createInteractionResultSchema(t('required'), t('maximum')), [t])
  const { control, handleSubmit } = useForm<InteractionResultFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { description: '' },
  })
  return (
    <Stack
      component="form"
      spacing={1.5}
      noValidate
      onSubmit={handleSubmit(async (values) => {
        await complete.mutateAsync(values).then(onCancel, () => undefined)
      })}
    >
      <Controller
        name="status"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            value={field.value ?? ''}
            select
            fullWidth
            label={t('result')}
            disabled={complete.isPending}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
          >
            {(['CONTACT_MADE', 'NO_RESPONSE', 'CANCELLED'] as const).map((status) => (
              <MenuItem key={status} value={status}>
                {t(`statuses.${status}`)}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <Controller
        name="description"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            fullWidth
            multiline
            minRows={2}
            label={t('description')}
            disabled={complete.isPending}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
            slotProps={{ htmlInput: { maxLength: INTERACTION_NOTE_LIMIT } }}
          />
        )}
      />
      {complete.isError && <Alert severity="error">{t('completeError')}</Alert>}
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button type="button" onClick={onCancel} disabled={complete.isPending}>
          {t('cancel')}
        </Button>
        <Button type="submit" variant="contained" disabled={complete.isPending}>
          {t('save')}
        </Button>
      </Stack>
    </Stack>
  )
}
