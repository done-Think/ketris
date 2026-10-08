import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { RhfTextField } from '@shared/components/form'
import { alpha, brand, radius, surface } from '@shared/theme/tokens'

import type { CreateLeadFieldName, CreateLeadReviewStepProps } from '../../types/lead'

const reviewFieldKeys: readonly CreateLeadFieldName[] = [
  'name',
  'phone',
  'interest',
  'budget',
  'source',
]

export function CreateLeadReviewStep({ control, formValues }: CreateLeadReviewStepProps) {
  const t = useTranslations('crm.leads')

  return (
    <Stack spacing={1.6}>
      <Box
        sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 1.2 }}
      >
        {reviewFieldKeys.map((fieldKey) => (
          <Box
            key={fieldKey}
            sx={{
              border: '1px solid',
              borderColor: alpha.graphite[8],
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.paper,
              p: 1.2,
            }}
          >
            <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 800 }}>
              {t(`create.fields.${fieldKey}`)}
            </Typography>
            <Typography sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 900 }}>
              {formValues[fieldKey]}
            </Typography>
          </Box>
        ))}
      </Box>

      <RhfTextField
        control={control}
        name="notes"
        label={t('create.fields.notes')}
        multiline
        minRows={3}
        fullWidth
      />
    </Stack>
  )
}
