import { useState } from 'react'
import { Controller } from 'react-hook-form'
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  IconButton,
  Tooltip,
  Typography,
  TextField,
} from '@mui/material'
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { useTranslations } from 'next-intl'
import {
  saleNegotiationConditions,
  rentalNegotiationConditions,
} from '@shared/config/property-negotiation'
import type { PropertyNegotiationConditionsFieldProps } from '../types/dashboard-property'
import { styles } from '../styles/create-property-values-step-fields.styles'

export function PropertyNegotiationConditionsField({
  control,
  propertyPurpose,
}: PropertyNegotiationConditionsFieldProps) {
  const t = useTranslations('common.propertyNegotiation')
  const [helpOpen, setHelpOpen] = useState(false)

  return (
    <Controller
      control={control}
      name="negotiationConditions"
      defaultValue={[]}
      render={({ field, fieldState }) => (
        <FormControl
          component="fieldset"
          aria-label={t('title')}
          error={Boolean(fieldState.error)}
          sx={styles.conditions}
        >
          <FormLabel component="legend">
            {t('title')}
            <Tooltip
              title={t('help')}
              describeChild
              open={helpOpen}
              onOpen={() => setHelpOpen(true)}
              onClose={() => setHelpOpen(false)}
              enterTouchDelay={0}
              slotProps={{ tooltip: { sx: styles.helpTooltip } }}
            >
              <IconButton
                type="button"
                size="small"
                aria-label={t('helpLabel')}
                onClick={() => setHelpOpen(true)}
                sx={styles.helpButton}
              >
                <InfoOutlinedIcon sx={styles.helpIcon} />
              </IconButton>
            </Tooltip>
          </FormLabel>
          <FormHelperText sx={styles.conditionHint}>{t('hint')}</FormHelperText>
          {(
            [
              ['SALE', saleNegotiationConditions],
              ['RENT', rentalNegotiationConditions],
            ] as const
          )
            .filter(([purpose]) => propertyPurpose.includes(purpose))
            .map(([purpose, options]) => (
              <Box key={purpose} sx={styles.conditionGroup}>
                <Typography variant="subtitle2">
                  {t(purpose === 'SALE' ? 'sale' : 'rent')}
                </Typography>
                <FormGroup sx={styles.conditionOptions}>
                  {options.map((condition) => (
                    <FormControlLabel
                      key={condition}
                      label={t(`options.${condition}`)}
                      sx={styles.conditionOption}
                      control={
                        <Checkbox
                          name={field.name}
                          inputRef={condition === options[0] ? field.ref : undefined}
                          onBlur={field.onBlur}
                          sx={styles.conditionCheckbox}
                          icon={<RadioButtonUncheckedRoundedIcon />}
                          checkedIcon={<CheckCircleRoundedIcon />}
                          checked={(field.value ?? []).includes(condition)}
                          disabled={
                            (condition === 'CASH_ONLY' &&
                              (field.value ?? []).includes('ACCEPTS_FINANCING')) ||
                            (condition === 'ACCEPTS_FINANCING' &&
                              (field.value ?? []).includes('CASH_ONLY'))
                          }
                          onChange={(_, checked) =>
                            field.onChange(
                              checked
                                ? [...(field.value ?? []), condition]
                                : (field.value ?? []).filter((value) => value !== condition),
                            )
                          }
                        />
                      }
                    />
                  ))}
                </FormGroup>
              </Box>
            ))}
          {fieldState.error ? <FormHelperText>{fieldState.error.message}</FormHelperText> : null}
          <Controller
            control={control}
            name="negotiationTerm"
            render={({ field: { ref, ...observation }, fieldState: observationState }) => (
              <TextField
                {...observation}
                inputRef={ref}
                label={t('observation')}
                multiline
                minRows={2}
                fullWidth
                error={Boolean(observationState.error)}
                helperText={observationState.error?.message ?? t('observationHint')}
                sx={styles.observation}
              />
            )}
          />
        </FormControl>
      )}
    />
  )
}
