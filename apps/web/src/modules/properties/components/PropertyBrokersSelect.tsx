import { Checkbox, ListItemText, MenuItem, TextField } from '@mui/material'
import { Controller } from 'react-hook-form'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { usePropertyBrokers } from '../hooks/use-property-brokers'
import type { CreatePropertyBasicStepFieldsProps } from '../types/dashboard-property'

export function PropertyBrokersSelect({ control }: CreatePropertyBasicStepFieldsProps) {
  const t = useTranslations('properties.create')
  const { data: session } = useSession()
  const brokers = usePropertyBrokers()
  if (session?.role !== 'OWNER') return null

  return (
    <Controller
      control={control}
      name="brokerIds"
      render={({ field: { ref, ...field }, fieldState }) => (
        <TextField
          {...field}
          inputRef={ref}
          select
          fullWidth
          label={t('fields.brokersWithAccess')}
          disabled={brokers.isLoading || brokers.isError}
          error={Boolean(fieldState.error) || brokers.isError}
          helperText={
            fieldState.error?.message ??
            (brokers.isError ? t('brokersLoadError') : t('brokersAccessHelp'))
          }
          slotProps={{
            inputLabel: { shrink: true },
            select: {
              multiple: true,
              displayEmpty: true,
              renderValue: () =>
                field.value.length
                  ? field.value
                      .map(
                        (id) =>
                          brokers.data?.find((broker) => broker.id === id)?.name ??
                          t('brokerUnavailable'),
                      )
                      .join(', ')
                  : t('noBrokerAccess'),
            },
          }}
        >
          {!brokers.data?.length ? <MenuItem disabled>{t('noAvailableBrokers')}</MenuItem> : null}
          {field.value
            .filter((id) => !brokers.data?.some((broker) => broker.id === id))
            .map((id) => (
              <MenuItem key={id} value={id}>
                <Checkbox checked />
                <ListItemText primary={t('brokerUnavailable')} />
              </MenuItem>
            ))}
          {(brokers.data ?? []).map((broker) => (
            <MenuItem key={broker.id} value={broker.id}>
              <Checkbox checked={field.value.includes(broker.id)} />
              <ListItemText primary={broker.name} />
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  )
}
