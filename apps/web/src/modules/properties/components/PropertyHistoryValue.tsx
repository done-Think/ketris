import { Box, Chip, Typography } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'
import { currencyOptions } from '@shared/config/currency'
import { isPropertyNegotiationCondition } from '@shared/config/property-negotiation'
import type { PropertyHistoryValueProps } from '../types/property-history'
import { propertyHistoryEnumKeys } from '../config/property-history-fields'
import { styles } from '../styles/property-history.styles'

export function PropertyHistoryValue({ field, value }: PropertyHistoryValueProps) {
  const t = useTranslations('properties.history')
  const negotiationText = useTranslations('common.propertyNegotiation')
  const formatter = useFormatter()
  const enumText = (text: string) => {
    if (field === 'listing.negotiationConditions' && isPropertyNegotiationCondition(text))
      return negotiationText(`options.${text}`)
    const key = propertyHistoryEnumKeys[`${field}:${text}` as keyof typeof propertyHistoryEnumKeys]
    return key ? t(`values.${key}`) : text
  }
  if (value === null || value === '') return <Typography>{t('none')}</Typography>
  if (typeof value === 'boolean') return <Typography>{t(value ? 'yes' : 'no')}</Typography>
  if (typeof value === 'number')
    return (
      <Typography>
        {formatter.number(
          value,
          ['price', 'rentalPrice', 'condoFee', 'propertyTax'].includes(field)
            ? currencyOptions
            : {},
        )}
      </Typography>
    )
  if (typeof value === 'string') return <Typography sx={styles.value}>{enumText(value)}</Typography>
  if (Array.isArray(value)) {
    if (!value.length) return <Typography>{t('none')}</Typography>
    if (field === 'brokers')
      return (
        <Typography sx={styles.value}>
          {value
            .map((item) =>
              typeof item !== 'string' && 'name' in item
                ? (item.name ?? t('unavailable'))
                : t('unavailable'),
            )
            .join(', ')}
        </Typography>
      )
    if (field !== 'media')
      return (
        <Typography sx={styles.value}>
          {value
            .filter((item): item is string => typeof item === 'string')
            .map(enumText)
            .join(', ')}
        </Typography>
      )
    return (
      <Box sx={styles.media}>
        {value.map((item, index) =>
          typeof item !== 'string' && 'url' in item ? (
            <Box key={`${item.url}-${index}`}>
              {item.type === 'video' ? (
                <Box component="video" controls src={item.url} sx={styles.photo} />
              ) : (
                <Box
                  component="img"
                  src={item.url}
                  alt={t('photo', { number: index + 1 })}
                  sx={styles.photo}
                />
              )}
              {index === 0 ? (
                <Box>
                  <Chip size="small" label={t('cover')} />
                </Box>
              ) : null}
            </Box>
          ) : null,
        )}
      </Box>
    )
  }
  if ('name' in value) return <Typography>{value.name ?? t('unavailable')}</Typography>
  return (
    <Box>
      <Typography sx={styles.value}>
        {[
          value.street,
          value.number,
          value.complement,
          value.neighborhood,
          value.city,
          value.state,
          value.zipCode,
        ]
          .filter(Boolean)
          .join(', ')}
      </Typography>
      {value.latitude !== null || value.longitude !== null ? (
        <Typography variant="caption" color="text.secondary">
          {t('coordinates', {
            latitude: value.latitude ?? t('none'),
            longitude: value.longitude ?? t('none'),
          })}
        </Typography>
      ) : null}
    </Box>
  )
}
