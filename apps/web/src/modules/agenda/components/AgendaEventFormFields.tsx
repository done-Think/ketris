'use client'

import { Box, MenuItem, Stack } from '@mui/material'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import type { Control } from 'react-hook-form'
import { useWatch } from 'react-hook-form'

import { RhfMaskedTextField, RhfTextField } from '@shared/components/form'

import {
  agendaEventKindOptions,
  agendaOtherPropertyValue,
} from '../schemas/agenda-event-form-schema'
import type { AgendaEventFormValues, AgendaPropertyOption } from '../types/agenda-event'
import {
  AGENDA_BUSINESS_HOURS_END,
  AGENDA_BUSINESS_HOURS_START,
  computeEarliestSchedulableSlot,
} from '../utils/scheduling-window'

const businessHoursStart = `${String(AGENDA_BUSINESS_HOURS_START).padStart(2, '0')}:00`
const businessHoursEnd = `${String(AGENDA_BUSINESS_HOURS_END).padStart(2, '0')}:00`

function getMinTimeForDate(scheduledDate: string): string {
  if (!dayjs(scheduledDate, 'YYYY-MM-DD', true).isValid()) return businessHoursStart

  const earliestSlot = computeEarliestSchedulableSlot()
  if (scheduledDate !== earliestSlot.format('YYYY-MM-DD')) return businessHoursStart

  const earliestTime = earliestSlot.format('HH:mm')
  return earliestTime > businessHoursStart ? earliestTime : businessHoursStart
}

const phoneMask = [{ mask: '(00) 0000-0000' }, { mask: '(00) 00000-0000' }]

export interface AgendaEventFormFieldsProps {
  control: Control<AgendaEventFormValues>
  maxDate: string
  minDate: string
  propertyOptions: AgendaPropertyOption[]
}

export function AgendaEventFormFields({
  control,
  maxDate,
  minDate,
  propertyOptions,
}: AgendaEventFormFieldsProps) {
  const t = useTranslations('agenda.eventForm')
  const selectedPropertyId = useWatch({ control, name: 'propertyId' })
  const selectedDate = useWatch({ control, name: 'scheduledDate' })
  const showCustomPropertyField = selectedPropertyId === agendaOtherPropertyValue
  const minTime = getMinTimeForDate(selectedDate)

  return (
    <Stack spacing={1.6} sx={{ pt: 1 }}>
      <Stack spacing={1.4}>
        <RhfTextField control={control} name="title" label={t('fields.title')} fullWidth />
        <RhfTextField control={control} name="kind" label={t('fields.kind')} select fullWidth>
          <MenuItem value="">{t('fields.kindPlaceholder')}</MenuItem>
          {agendaEventKindOptions.map((kind) => (
            <MenuItem key={kind} value={kind}>
              {t(`kinds.${kind}`)}
            </MenuItem>
          ))}
        </RhfTextField>
        <RhfTextField
          control={control}
          name="propertyId"
          label={t('fields.property')}
          select
          fullWidth
        >
          {propertyOptions.map((property) => (
            <MenuItem key={property.id} value={property.id}>
              {property.label}
            </MenuItem>
          ))}
          <MenuItem value={agendaOtherPropertyValue}>{t('fields.otherProperty')}</MenuItem>
        </RhfTextField>
        {showCustomPropertyField ? (
          <RhfTextField
            control={control}
            name="customProperty"
            label={t('fields.customProperty')}
            fullWidth
          />
        ) : null}
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 1.4,
        }}
      >
        <RhfTextField
          control={control}
          name="participant"
          label={t('fields.participant')}
          fullWidth
        />
        <RhfMaskedTextField
          control={control}
          name="phone"
          label={t('fields.phone')}
          mask={phoneMask}
          fullWidth
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr' },
          gap: 1.4,
        }}
      >
        <RhfTextField
          control={control}
          name="scheduledDate"
          label={t('fields.date')}
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          inputProps={{ max: maxDate, min: minDate }}
        />
        <RhfTextField
          control={control}
          name="scheduledTime"
          label={t('fields.time')}
          type="time"
          fullWidth
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: minTime, max: businessHoursEnd, step: 900 }}
        />
        <RhfTextField
          control={control}
          name="durationMinutes"
          label={t('fields.duration')}
          type="number"
          fullWidth
          inputProps={{ min: 15, step: 15 }}
        />
      </Box>

      <RhfTextField
        control={control}
        name="notes"
        label={t('fields.notes')}
        minRows={3}
        multiline
        fullWidth
      />
    </Stack>
  )
}
