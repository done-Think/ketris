import { Controller } from 'react-hook-form'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { ContactPicker } from '@modules/crm/contact-picker'

import type { CreatePropertyBasicStepFieldsProps } from '../types/dashboard-property'

export function PropertyOwnerSelect({ control }: CreatePropertyBasicStepFieldsProps) {
  const t = useTranslations('properties.create')
  const { data: session } = useSession()
  const canChooseOwner = session?.role === 'OWNER' || session?.role === 'AGENT'
  if (!canChooseOwner) return null

  return (
    <Controller
      control={control}
      name="ownerContact"
      render={({ field, fieldState }) => (
        <ContactPicker
          value={field.value}
          onChange={field.onChange}
          label={t('fields.owner')}
          error={Boolean(fieldState.error)}
          helperText={
            fieldState.error?.message ??
            `${field.value ? '' : `${t('noOwner')}. `}${t('ownerContactHelp')}`
          }
        />
      )}
    />
  )
}
