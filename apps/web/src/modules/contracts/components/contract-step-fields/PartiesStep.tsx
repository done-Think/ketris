import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { Box, Button, Divider } from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, brand } from '@shared/theme/tokens'

import type { ContractPartiesStepProps } from '../../types/contract'
import { FieldGrid, SectionTitle, makePartyFieldsMeta, toFieldConfig } from './shared'

export const partiesStepFieldNames = [
  ...makePartyFieldsMeta('owner').map((field) => field.name),
  ...makePartyFieldsMeta('tenant').map((field) => field.name),
  'hasGuarantor' as const,
  ...makePartyFieldsMeta('guarantor').map((field) => field.name),
]

export function PartiesStep({ control, setValue, values }: ContractPartiesStepProps) {
  const t = useTranslations('contracts.wizard.parties')

  const ownerFields = makePartyFieldsMeta('owner').map((field) => toFieldConfig(field, t))
  const tenantFields = makePartyFieldsMeta('tenant').map((field) => toFieldConfig(field, t))
  const guarantorFields = makePartyFieldsMeta('guarantor').map((field) => toFieldConfig(field, t))
  const hasActiveGuarantor = values.hasGuarantor || values.guaranteeType === 'FIADOR'

  const addGuarantor = () => {
    setValue('hasGuarantor', true, { shouldDirty: true })
    setValue('guaranteeType', 'FIADOR', { shouldDirty: true })
  }

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr auto 1fr' },
          gap: { xs: 3.2, lg: 6.5, xl: 9 },
          alignItems: 'start',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <SectionTitle>{t('ownerTitle')}</SectionTitle>
          <FieldGrid control={control} fields={ownerFields} />
        </Box>
        <Divider
          orientation="vertical"
          flexItem
          sx={{
            display: { xs: 'none', lg: 'block' },
            borderColor: alpha.graphite[10],
            minHeight: 120,
            mt: 2.2,
          }}
        />
        <Box sx={{ minWidth: 0 }}>
          <SectionTitle>{t('tenantTitle')}</SectionTitle>
          <FieldGrid control={control} fields={tenantFields} />
        </Box>
      </Box>

      {hasActiveGuarantor ? (
        <Box sx={{ mt: 3.2 }}>
          <SectionTitle>{t('guarantorTitle')}</SectionTitle>
          <FieldGrid control={control} fields={guarantorFields} />
        </Box>
      ) : (
        <Button
          type="button"
          startIcon={<AddRoundedIcon />}
          onClick={addGuarantor}
          sx={{
            mt: 3.2,
            px: 0,
            color: brand.magenta[500],
            fontSize: 13,
            fontWeight: 900,
            textTransform: 'none',
            '&:hover': { bgcolor: 'transparent', color: brand.magenta[700] },
          }}
        >
          {t('addGuarantor')}
        </Button>
      )}
    </>
  )
}
