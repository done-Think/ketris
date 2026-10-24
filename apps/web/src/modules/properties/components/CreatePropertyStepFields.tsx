import { styles } from '../styles/create-property-step-fields.styles'
import { Typography } from '@mui/material'

import type { CreatePropertyStepFieldsProps } from '../types/dashboard-property'
import { CreatePropertyAddressStepFields } from './CreatePropertyAddressStepFields'
import { CreatePropertyBasicStepFields } from './CreatePropertyBasicStepFields'
import { CreatePropertyFeaturesStepFields } from './CreatePropertyFeaturesStepFields'
import { CreatePropertyPublishingStepFields } from './CreatePropertyPublishingStepFields'
import { CreatePropertyValuesStepFields } from './CreatePropertyValuesStepFields'
import { PropertyMediaUploadField } from './PropertyMediaUploadField'

export function CreatePropertyStepFields({
  control,
  onAddressChange,
  activeStepKey,
  activeStepLabel,
  propertyPurpose,
}: CreatePropertyStepFieldsProps) {
  const hasRentPurpose = propertyPurpose.includes('RENT')
  const hasSalePurpose = propertyPurpose.includes('SALE')
  const hasDualPurpose = hasRentPurpose && hasSalePurpose
  const mainValueLabel = hasRentPurpose && !hasSalePurpose ? 'rentValue' : 'saleValue'
  const negotiationTermLabel =
    hasRentPurpose && !hasSalePurpose
      ? 'securityDeposit'
      : hasSalePurpose && !hasRentPurpose
        ? 'commission'
        : 'commercialTerms'

  return (
    <>
      <Typography sx={styles.typography}>{activeStepLabel}</Typography>

      {activeStepKey === 'basic' ? <CreatePropertyBasicStepFields control={control} /> : null}

      {activeStepKey === 'address' ? (
        <CreatePropertyAddressStepFields control={control} onAddressChange={onAddressChange} />
      ) : null}

      {activeStepKey === 'features' ? <CreatePropertyFeaturesStepFields control={control} /> : null}

      {activeStepKey === 'media' ? <PropertyMediaUploadField control={control} /> : null}

      {activeStepKey === 'values' ? (
        <CreatePropertyValuesStepFields
          control={control}
          hasDualPurpose={hasDualPurpose}
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
