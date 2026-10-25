'use client'

import { AgendaPropertyField } from './AgendaPropertyField'

import { styles } from '../styles/agenda-event-form-fields.styles'

import { Alert, Box, FormControlLabel, MenuItem, Stack, Switch } from '@mui/material'
import { useTranslations } from 'next-intl'
import { Controller, useWatch } from 'react-hook-form'

import { RhfMaskedTextField, RhfTextField } from '@shared/components/form'
import { AGENDA_MINIMUM_VISIT_MINUTES } from '@shared/lib/utils/agenda-scheduling'

import {
  agendaEventKindOptions,
  agendaOtherPropertyValue,
} from '../schemas/agenda-event-form-schema'
import type { AgendaEventFormFieldsProps } from '../types/agenda-event'
const phoneMask = [{ mask: '(00) 0000-0000' }, { mask: '(00) 00000-0000' }]

export function AgendaEventFormFields({
  canManageAudience = false,
  agentOptions = [],
  agentsLoading = false,
  agentsError = false,
  control,
  maxDate,
  minDate,
  propertyOptions,
}: AgendaEventFormFieldsProps) {
  const t = useTranslations('agenda.eventForm')
  const selectedPropertyId = useWatch({ control, name: 'propertyId' })
  const internal = useWatch({ control, name: 'internal' })
  const audience = useWatch({ control, name: 'audience' })
  const kind = useWatch({ control, name: 'kind' })
  const showCustomPropertyField = selectedPropertyId === agendaOtherPropertyValue

  return (
    <Stack spacing={1.6} sx={styles.stack}>
      {canManageAudience && (
        <Stack spacing={1.4}>
          <Controller
            control={control}
            name="internal"
            render={({ field }) => (
              <FormControlLabel
                label={t('fields.internal')}
                control={
                  <Switch
                    checked={Boolean(field.value)}
                    onChange={(_, checked) => field.onChange(checked)}
                    inputRef={field.ref}
                  />
                }
              />
            )}
          />
          <RhfTextField
            control={control}
            name="audience"
            label={t('fields.audience')}
            select
            fullWidth
          >
            {audience === 'SHARED_TEAM' && (
              <MenuItem value="SHARED_TEAM">{t('audiences.SHARED_TEAM')}</MenuItem>
            )}
            <MenuItem value="ALL_AGENTS">{t('audiences.ALL_AGENTS')}</MenuItem>
            <MenuItem value="ASSIGNED_AGENT">{t('audiences.ASSIGNED_AGENT')}</MenuItem>
          </RhfTextField>
          {audience === 'ASSIGNED_AGENT' && (
            <>
              <RhfTextField
                control={control}
                name="responsibleId"
                label={t('fields.agent')}
                select
                fullWidth
                disabled={agentsLoading || agentsError}
              >
                <MenuItem value="">{t('fields.agentPlaceholder')}</MenuItem>
                {agentOptions.map((agent) => (
                  <MenuItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </MenuItem>
                ))}
              </RhfTextField>
              {agentsLoading && <Alert severity="info">{t('agentsLoading')}</Alert>}
              {agentsError && <Alert severity="error">{t('agentsError')}</Alert>}
              {!agentsLoading && !agentsError && agentOptions.length === 0 && (
                <Alert severity="info">{t('agentsEmpty')}</Alert>
              )}
            </>
          )}
        </Stack>
      )}
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
        <AgendaPropertyField
          control={control}
          internal={internal}
          propertyOptions={propertyOptions}
        />
        {showCustomPropertyField ? (
          <RhfTextField
            control={control}
            name="customProperty"
            label={t('fields.customProperty')}
            fullWidth
          />
        ) : null}
      </Stack>

      <Box sx={styles.box}>
        <RhfTextField
          control={control}
          name="participant"
          label={internal ? t('fields.optionalParticipant') : t('fields.participant')}
          fullWidth
        />
        <RhfMaskedTextField
          control={control}
          name="phone"
          label={internal ? t('fields.optionalPhone') : t('fields.phone')}
          mask={phoneMask}
          fullWidth
        />
      </Box>

      <Box sx={styles.box2}>
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
          inputProps={{ step: 900 }}
        />
        <RhfTextField
          control={control}
          name="durationMinutes"
          label={t('fields.duration')}
          type="number"
          fullWidth
          inputProps={{ min: kind === 'VISIT' ? AGENDA_MINIMUM_VISIT_MINUTES : 15, step: 15 }}
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
