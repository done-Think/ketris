import { Typography } from '@mui/material'

import { brand } from '@shared/theme/tokens'

import type { CreatePropertyStepFieldsProps } from '../types/dashboard-property'
import { CreatePropertyAddressStepFields } from './CreatePropertyAddressStepFields'
import { CreatePropertyBasicStepFields } from './CreatePropertyBasicStepFields'
import { CreatePropertyFeaturesStepFields } from './CreatePropertyFeaturesStepFields'
import { CreatePropertyPublishingStepFields } from './CreatePropertyPublishingStepFields'
import { CreatePropertyValuesStepFields } from './CreatePropertyValuesStepFields'
import { PropertyMediaUploadField } from './PropertyMediaUploadField'

export function CreatePropertyStepFields({
  control,
  activeStepKey,
  activeStepLabel,
  propertyPurpose,
}: CreatePropertyStepFieldsProps) {
  const hasRentPurpose = propertyPurpose.includes('Aluguel')
  const hasSalePurpose = propertyPurpose.includes('Venda')
  const mainValueLabel =
    hasRentPurpose && !hasSalePurpose
      ? 'rentValue'
      : hasSalePurpose && !hasRentPurpose
        ? 'saleValue'
        : 'referenceValue'
  const negotiationTermLabel =
    hasRentPurpose && !hasSalePurpose
      ? 'securityDeposit'
      : hasSalePurpose && !hasRentPurpose
        ? 'commission'
        : 'commercialTerms'

  return (
    <>
      <Typography
        sx={{
          color: { xs: brand.neutral[500], md: 'primary.main' },
          fontSize: { xs: 11, md: 13 },
          fontWeight: 900,
          mb: { xs: 1.8, md: 2.2 },
          textTransform: 'uppercase',
        }}
      >
        {activeStepLabel}
      </Typography>

      {activeStepKey === 'basic' ? <CreatePropertyBasicStepFields control={control} /> : null}

      {activeStepKey === 'address' ? <CreatePropertyAddressStepFields control={control} /> : null}

      {activeStepKey === 'features' ? <CreatePropertyFeaturesStepFields control={control} /> : null}

      {activeStepKey === 'media' ? <PropertyMediaUploadField control={control} /> : null}

      {activeStepKey === 'values' ? (
        <CreatePropertyValuesStepFields
          control={control}
          mainValueLabel={mainValueLabel}
          negotiationTermLabel={negotiationTermLabel}
        />
      ) : null}

      {activeStepKey === 'publishing' ? (
        <CreatePropertyPublishingStepFields control={control} />
      ) : null}
    </>
  )
}
