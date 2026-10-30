import { MenuItem, TextField } from '@mui/material'
import { Controller } from 'react-hook-form'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { usePropertyOwners } from '../hooks/use-properties'
import type { CreatePropertyBasicStepFieldsProps } from '../types/dashboard-property'

export function PropertyOwnerAccessSelect({ control }: CreatePropertyBasicStepFieldsProps) {
  const t = useTranslations('properties.create')
  const { data: session } = useSession()
  const canChooseOwner = session?.role === 'OWNER' || session?.role === 'AGENT'
  const owners = usePropertyOwners(canChooseOwner)
  if (!canChooseOwner) return null

  return (
    <Controller
      control={control}
      name="ownerUserId"
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          select
          fullWidth
          label={t('fields.ownerAccessAccount')}
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          disabled={owners.isLoading || owners.isError}
          error={Boolean(fieldState.error) || owners.isError}
          helperText={
            fieldState.error?.message ??
            (owners.isError ? t('ownersLoadError') : t('ownerAccessHelp'))
          }
        >
          <MenuItem value="">{t('noOwnerAccess')}</MenuItem>
          {field.value && !owners.data?.some((owner) => owner.id === field.value) ? (
            <MenuItem value={field.value} disabled>
              {t('ownerUnavailable')}
            </MenuItem>
          ) : null}
          {(owners.data ?? []).map((owner) => (
            <MenuItem key={owner.id} value={owner.id}>
              {owner.name}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  )
}
