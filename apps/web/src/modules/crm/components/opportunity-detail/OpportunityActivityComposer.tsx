'use client'

import { Alert, Button, MenuItem, Stack, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import type { OpportunityActivityComposerProps } from '../../types/opportunity-detail'
import { useRecordOpportunityActivity } from '../../hooks/use-opportunities'
import { extractErrorMessage } from '@shared/utils/error-message'

export function OpportunityActivityComposer({ opportunityId }: OpportunityActivityComposerProps) {
  const t = useTranslations('crm.opportunityDetail.activityComposer')
  const activity = useRecordOpportunityActivity(opportunityId)
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'NOTE' | 'CONTACT_MADE'>('NOTE')
  const [submitted, setSubmitted] = useState(false)

  return (
    <Stack
      component="form"
      spacing={1.2}
      onSubmit={async (event) => {
        event.preventDefault()
        setSubmitted(true)
        if (!description.trim()) return
        const saved = await activity.mutateAsync({ description: description.trim(), type }).then(
          () => true,
          () => false,
        )
        if (saved) {
          setDescription('')
          setSubmitted(false)
        }
      }}
    >
      <TextField
        label={t('type')}
        select
        value={type}
        disabled={activity.isPending}
        onChange={(event) =>
          setType(event.target.value === 'CONTACT_MADE' ? 'CONTACT_MADE' : 'NOTE')
        }
      >
        <MenuItem value="NOTE">{t('note')}</MenuItem>
        <MenuItem value="CONTACT_MADE">{t('contact')}</MenuItem>
      </TextField>
      <TextField
        label={t('description')}
        value={description}
        multiline
        minRows={2}
        disabled={activity.isPending}
        onChange={(event) => setDescription(event.target.value)}
        error={submitted && !description.trim()}
        helperText={submitted && !description.trim() ? t('required') : undefined}
        slotProps={{ htmlInput: { maxLength: 2000 } }}
      />
      {activity.isError && (
        <Alert severity="error">{extractErrorMessage(activity.error, t('error'))}</Alert>
      )}
      {activity.isSuccess && <Alert severity="success">{t('success')}</Alert>}
      <Button type="submit" variant="contained" disabled={activity.isPending}>
        {t('save')}
      </Button>
    </Stack>
  )
}
