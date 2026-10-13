import { Autocomplete, Box, Stack, TextField } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'

import { formatCurrency } from '@shared/lib/utils/format'
import { alpha, radius } from '@shared/theme/tokens'

import { useCrmProperties, useOpportunities } from '@modules/crm/hooks/use-opportunities'

import { useContracts } from '../../hooks/use-contracts'
import type {
  ContractOpportunityStepProps,
  EligibleContractOpportunity,
} from '../../types/contract'
import { contractTextFieldSx } from '../contract-form.styles'
import { ReviewItem } from './ReviewStep'
import { SectionTitle } from './shared'

export const opportunityStepFieldNames = ['opportunityId' as const]

function formatPropertyAddress(property: { neighborhood: string | null; city: string | null }) {
  return [property.neighborhood, property.city].filter(Boolean).join(', ')
}

export function OpportunityStep({ control, setValue, values }: ContractOpportunityStepProps) {
  const t = useTranslations('contracts.wizard.opportunity')
  const { data: session } = useSession()
  const tenantId = session?.tenantId ?? ''

  const acceptedOpportunitiesQuery = useOpportunities(tenantId, { status: 'ACEITA' })
  const contractsQuery = useContracts(tenantId)
  const propertiesQuery = useCrmProperties(tenantId)

  const contractedOpportunityIds = new Set(
    (contractsQuery.data?.items ?? []).map((item) => item.opportunityId),
  )
  const propertiesById = new Map(
    (propertiesQuery.data ?? []).map((property) => [property.id, property]),
  )

  const eligibleOpportunities: EligibleContractOpportunity[] = (
    acceptedOpportunitiesQuery.data ?? []
  )
    .filter((opportunity) => !contractedOpportunityIds.has(opportunity.id))
    .map((opportunity) => {
      const property = propertiesById.get(opportunity.propertyId)

      return {
        id: opportunity.id,
        leadName: opportunity.leadName,
        leadEmail: opportunity.leadEmail,
        leadPhone: opportunity.leadPhone,
        propertyId: opportunity.propertyId,
        propertyTitle: property?.title ?? opportunity.propertyId,
        propertyAddress: property ? formatPropertyAddress(property) : '',
        amountLabel: formatCurrency(opportunity.proposedValue),
      }
    })

  const selectedOpportunity =
    eligibleOpportunities.find((opportunity) => opportunity.id === values.opportunityId) ?? null

  const applyOpportunity = (opportunity: EligibleContractOpportunity | null) => {
    setValue('opportunityId', opportunity?.id ?? '', { shouldDirty: true })

    if (opportunity) {
      setValue('tenantName', opportunity.leadName, { shouldDirty: true })
      setValue('tenantEmail', opportunity.leadEmail, { shouldDirty: true })
      if (opportunity.leadPhone) {
        setValue('tenantPhone', opportunity.leadPhone, { shouldDirty: true })
      }
    }
  }

  const isLoading =
    acceptedOpportunitiesQuery.isLoading || contractsQuery.isLoading || propertiesQuery.isLoading

  return (
    <Stack spacing={3}>
      <Box>
        <SectionTitle>{t('title')}</SectionTitle>
        <Controller
          control={control}
          name="opportunityId"
          render={({ field, fieldState }) => (
            <Autocomplete
              options={eligibleOpportunities}
              getOptionLabel={(opportunity) =>
                `${opportunity.leadName} — ${opportunity.propertyTitle}`
              }
              isOptionEqualToValue={(option, selected) => option.id === selected.id}
              value={selectedOpportunity}
              loading={isLoading}
              noOptionsText={t('picker.noOptions')}
              onChange={(_event, opportunity) => {
                field.onChange(opportunity?.id ?? '')
                applyOpportunity(opportunity)
              }}
              onBlur={field.onBlur}
              renderInput={(params) => (
                <TextField
                  {...params}
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

        {selectedOpportunity ? (
          <Box
            sx={{
              mt: 2.4,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
              gap: 1.8,
              border: '1px solid',
              borderColor: alpha.graphite[8],
              borderRadius: `${radius.sm}px`,
              p: { xs: 2, md: 2.4 },
            }}
          >
            <ReviewItem label={t('summary.property')} value={selectedOpportunity.propertyTitle} />
            <ReviewItem label={t('summary.address')} value={selectedOpportunity.propertyAddress} />
            <ReviewItem label={t('summary.lead')} value={selectedOpportunity.leadName} />
            <ReviewItem label={t('summary.amount')} value={selectedOpportunity.amountLabel} />
          </Box>
        ) : null}
      </Box>
    </Stack>
  )
}
