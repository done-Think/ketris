import { Box } from '@mui/material'
import { useTranslations } from 'next-intl'
import * as crmStyles from '../../styles/create-lead-contact-step.styles'

import { RhfMaskedTextField, RhfTextField } from '@shared/components/form'

import type { CreateLeadContactStepProps } from '../../types/lead'

const phoneMask = [{ mask: '(00) 0000-0000' }, { mask: '(00) 00000-0000' }]

export function CreateLeadContactStep({ control, contact }: CreateLeadContactStepProps) {
  const t = useTranslations('crm.leads')

  return (
    <Box sx={crmStyles.boxSx}>
      <RhfTextField
        control={control}
        name="name"
        label={t('create.fields.name')}
        slotProps={{ htmlInput: { readOnly: Boolean(contact) } }}
      />
      <RhfMaskedTextField
        control={control}
        name="phone"
        label={t('create.fields.phone')}
        mask={phoneMask}
        slotProps={{ htmlInput: { readOnly: Boolean(contact?.phone) } }}
      />
      <RhfTextField
        control={control}
        name="email"
        label={t('create.fields.email')}
        type="email"
        slotProps={{ htmlInput: { readOnly: Boolean(contact) } }}
        required
        sx={crmStyles.rhfTextFieldSx}
      />
    </Box>
  )
}
