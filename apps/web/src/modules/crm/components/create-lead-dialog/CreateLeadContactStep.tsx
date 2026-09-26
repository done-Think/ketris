import { Box } from '@mui/material'
import { useTranslations } from 'next-intl'

import { RhfMaskedTextField, RhfTextField } from '@shared/components/form'

import type { CreateLeadContactStepProps } from '../../types/lead'

const phoneMask = [{ mask: '(00) 0000-0000' }, { mask: '(00) 00000-0000' }]

export function CreateLeadContactStep({ control }: CreateLeadContactStepProps) {
  const t = useTranslations('crm.leads')

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.4 }}>
      <RhfTextField control={control} name="name" label={t('create.fields.name')} />
      <RhfMaskedTextField
        control={control}
        name="phone"
        label={t('create.fields.phone')}
        mask={phoneMask}
      />
      <RhfTextField
        control={control}
        name="email"
        label={t('create.fields.email')}
        type="email"
        required
        sx={{ gridColumn: { md: '1 / -1' } }}
      />
    </Box>
  )
}
