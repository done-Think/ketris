import { formatCurrency } from '@shared/lib/utils/format'
import { useState } from 'react'
import { Alert, Autocomplete, Box, Button, Stack, TextField } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'
import { Controller, useWatch } from 'react-hook-form'
import { useDebouncedValue } from '@shared/hooks/use-debounced-value'
import {
  useContractOpportunities,
  useContractOpportunitySelection,
} from '../../hooks/use-contract-opportunities'
import type { ContractOpportunityStepProps } from '../../types/contract'
import type { ContractOpportunity } from '../../types/service'
import { contractTextFieldSx } from '../../styles/contract-form.styles'
import { styles } from '../../styles/opportunity-step.styles'
import { ReviewItem } from './ReviewStep'
import { SectionTitle } from './shared'

export function OpportunityStep({ control, setValue }: ContractOpportunityStepProps) {
  const opportunityId = useWatch({ control, name: 'opportunityId' })
  const t = useTranslations('contracts.wizard.opportunity')
  const formatter = useFormatter()
  const [search, setSearch] = useState('')
  const query = useContractOpportunities(useDebouncedValue(search))
  const options = query.data?.pages.flatMap((page) => page.items) ?? []
  const { selected, remember } = useContractOpportunitySelection(opportunityId, options)

  function applyOpportunity(opportunity: ContractOpportunity | null) {
    if ((opportunity?.id ?? '') === opportunityId) return
    if (opportunity) remember(opportunity)
    setValue('opportunityId', opportunity?.id ?? '', { shouldDirty: true })
    setValue('amount', opportunity?.proposedValue ?? 0, { shouldDirty: true })
    setValue('tenantName', opportunity?.leadName ?? '', { shouldDirty: true })
    setValue('tenantEmail', opportunity?.leadEmail ?? '', { shouldDirty: true })
    setValue('tenantPhone', opportunity?.leadPhone ?? '', { shouldDirty: true })
    setValue('tenantCpf', '', { shouldDirty: true })
    setValue('ownerName', opportunity?.owner?.name ?? '', { shouldDirty: true })
    setValue('ownerEmail', opportunity?.owner?.email ?? '', { shouldDirty: true })
    setValue('ownerPhone', opportunity?.owner?.phone ?? '', { shouldDirty: true })
    setValue('ownerCpf', '', { shouldDirty: true })
  }

  return (
    <Stack spacing={3}>
      <Box>
        <SectionTitle>{t('title')}</SectionTitle>
        <Controller
          control={control}
          name="opportunityId"
          render={({ field, fieldState }) => (
            <Autocomplete
              options={
                selected && !options.some((item) => item.id === selected.id)
                  ? [selected, ...options]
                  : options
              }
              getOptionLabel={(option) => option.leadName + ' — ' + option.propertyTitle}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              filterOptions={(items) => items}
              value={selected}
              loading={query.isFetching}
              noOptionsText={t('picker.noOptions')}
              loadingText={t('picker.loading')}
              clearText={t('picker.clear')}
              openText={t('picker.open')}
              closeText={t('picker.close')}
              onInputChange={(_event, value, reason) => {
                if (reason === 'input' || reason === 'clear') setSearch(value)
              }}
              onChange={(_event, option) => applyOpportunity(option)}
              onBlur={field.onBlur}
              renderInput={(params) => (
                <TextField
                  {...params}
                  inputRef={field.ref}
                  label={t('picker.label')}
                  helperText={fieldState.error?.message ?? t('picker.helperText')}
                  error={Boolean(fieldState.error)}
                  InputLabelProps={{ shrink: true }}
                  sx={contractTextFieldSx}
                />
              )}
            />
          )}
        />
        {query.isError && (
          <Alert
            severity="error"
            action={<Button onClick={() => query.refetch()}>{t('picker.retry')}</Button>}
          >
            {t('picker.error')}
          </Alert>
        )}
        {query.hasNextPage && (
          <Button disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
            {t('picker.more')}
          </Button>
        )}
        {selected && (
          <Box sx={styles.box}>
            <ReviewItem label={t('summary.property')} value={selected.propertyTitle} />
            <ReviewItem label={t('summary.address')} value={selected.propertyAddress} />
            <ReviewItem label={t('summary.lead')} value={selected.leadName} />
            <ReviewItem
              label={t('summary.amount')}
              value={formatCurrency(selected.proposedValue, formatter.number)}
            />
          </Box>
        )}
      </Box>
    </Stack>
  )
}
