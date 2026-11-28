import { canConnectInstagram } from '@shared/lib/auth/instagram-access'
import { useController, useWatch } from 'react-hook-form'
import { Alert, Checkbox, FormControlLabel, Stack } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useFormatter, useTranslations } from 'next-intl'
import { formatCurrency } from '@shared/lib/utils/format'
import { InstagramPostEditor } from '@shared/components/integrations/InstagramPostEditor'
import { useInstagramConnection } from '@shared/hooks/use-instagram'
import type { CreatePropertyPublishingStepFieldsProps } from '../types/dashboard-property'
import { createPropertyPublishingOptions } from '../config/dashboard-property-ui'

export function PropertyInstagramReview({ control }: CreatePropertyPublishingStepFieldsProps) {
  const t = useTranslations('properties.instagram')
  const formatter = useFormatter()
  const { data: session } = useSession()
  const connection = useInstagramConnection()
  const enabled = useController({ control, name: 'instagramEnabled' })
  const caption = useController({ control, name: 'instagramCaption' })
  const images = useController({ control, name: 'instagramImageUrls' })
  const values = useWatch({ control })
  if (!canConnectInstagram(session?.role)) return null
  const canPublish =
    connection.data?.connected &&
    !connection.data.expired &&
    values.publishingOptions?.includes(createPropertyPublishingOptions[0])
  const availableImages = [
    ...new Set(
      (values.media ?? []).map((item) => item.url).filter((url): url is string => Boolean(url)),
    ),
  ]
  return (
    <Stack spacing={2}>
      <FormControlLabel
        label={t('alsoPublish')}
        control={
          <Checkbox
            checked={Boolean(enabled.field.value)}
            disabled={!canPublish}
            onChange={(_, checked) => {
              enabled.field.onChange(checked)
              if (checked) {
                images.field.onChange(availableImages.slice(0, 20))
                if (!caption.field.value)
                  caption.field.onChange(
                    `${values.title ?? ''}\n${values.neighborhood ?? ''}, ${values.city ?? ''}\n${formatCurrency(values.mainValue ?? 0, formatter.number)}\n\n${values.description ?? ''}`.slice(
                      0,
                      2200,
                    ),
                  )
              }
            }}
          />
        }
      />
      {!canPublish && <Alert severity="info">{t('connectFirst')}</Alert>}
      {enabled.field.value && (
        <>
          <Alert severity="info">
            {t('target', { username: connection.data?.username ?? '' })}
          </Alert>
          <InstagramPostEditor
            images={availableImages}
            selected={images.field.value ?? []}
            caption={caption.field.value ?? ''}
            onSelectionChange={images.field.onChange}
            onCaptionChange={caption.field.onChange}
          />
          {images.fieldState.error && <Alert severity="error">{t('choosePhotos')}</Alert>}
        </>
      )}
    </Stack>
  )
}
