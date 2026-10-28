import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { Controller, useFieldArray, useFormContext } from 'react-hook-form'
import * as crmStyles from '../../styles/opportunity-terms-fields.styles'
import type { Opportunity, OpportunityEditFormValues } from '../../types/opportunity'
import { ContactAutocomplete } from './ContactAutocomplete'

export function OpportunityTermsFields() {
  const t = useTranslations('crm.opportunityDetail')
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<OpportunityEditFormValues>()
  const conditions = useFieldArray({ control, name: 'specialConditions' })
  return (
    <>
      <Box sx={crmStyles.conditionsSx}>
        <Controller
          control={control}
          name="contact"
          render={({ field, fieldState }) => (
            <ContactAutocomplete
              value={field.value}
              onChange={(contact) => {
                field.onChange(contact)
                if (contact) {
                  setValue('leadName', contact.name, { shouldDirty: true, shouldValidate: true })
                  setValue('leadEmail', contact.email, { shouldDirty: true, shouldValidate: true })
                  setValue('leadPhone', contact.phone ?? '', {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              }}
              error={Boolean(fieldState.error)}
              helperText={field.value ? t('fields.contactSyncHelper') : undefined}
            />
          )}
        />
      </Box>
      <TextField
        label={t('fields.contractTerm')}
        type="number"
        slotProps={{ htmlInput: { min: 1, step: 1 } }}
        error={Boolean(errors.contractTermMonths)}
        helperText={errors.contractTermMonths?.message}
        {...register('contractTermMonths')}
      />
      <TextField
        label={t('fields.intendedStart')}
        type="date"
        slotProps={{ inputLabel: { shrink: true } }}
        error={Boolean(errors.desiredStartDate)}
        helperText={errors.desiredStartDate?.message}
        {...register('desiredStartDate')}
      />
      <Controller
        control={control}
        name="guaranteeType"
        render={({ field }) => (
          <FormControl error={Boolean(errors.guaranteeType)}>
            <InputLabel id="guarantee-label">{t('fields.guarantee')}</InputLabel>
            <Select
              labelId="guarantee-label"
              label={t('fields.guarantee')}
              value={field.value}
              onChange={(event) =>
                field.onChange(event.target.value as Opportunity['guaranteeType'])
              }
              onBlur={field.onBlur}
              inputRef={field.ref}
            >
              <MenuItem value="NONE">{t('guarantees.none')}</MenuItem>
              <MenuItem value="GUARANTOR">{t('guarantees.guarantor')}</MenuItem>
              <MenuItem value="DEPOSIT">{t('guarantees.deposit')}</MenuItem>
              <MenuItem value="SURETY_BOND">{t('guarantees.insurance')}</MenuItem>
            </Select>
            {errors.guaranteeType?.message && (
              <FormHelperText>{errors.guaranteeType.message}</FormHelperText>
            )}
          </FormControl>
        )}
      />
      <Box sx={crmStyles.conditionsSx}>
        <Typography component="h3" variant="subtitle2">
          {t('fields.specialConditions')}
        </Typography>
        <Stack spacing={1}>
          {conditions.fields.map((condition, index) => (
            <Stack direction="row" spacing={1} key={condition.id} alignItems="flex-start">
              <TextField
                fullWidth
                multiline
                minRows={2}
                label={t('fields.conditionNumber', { number: index + 1 })}
                error={Boolean(errors.specialConditions?.[index]?.text)}
                helperText={errors.specialConditions?.[index]?.text?.message}
                {...register(`specialConditions.${index}.text`)}
              />
              <IconButton
                type="button"
                aria-label={t('fields.removeCondition', { number: index + 1 })}
                onClick={() => conditions.remove(index)}
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Stack>
          ))}
        </Stack>
        <Button type="button" onClick={() => conditions.append({ text: '' })}>
          {t('fields.addCondition')}
        </Button>
      </Box>
    </>
  )
}
