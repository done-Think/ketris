'use client'

import {
  Box,
  Checkbox,
  FormControlLabel,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import { useTranslations } from 'next-intl'
import { radius, surface } from '@shared/theme/tokens'
import type { InstagramPostEditorProps } from '@shared/types/instagram'

export function InstagramPostEditor({
  images,
  selected,
  caption,
  onSelectionChange,
  onCaptionChange,
  disabled,
}: InstagramPostEditorProps) {
  const t = useTranslations('properties.instagram')
  const ordered = [...selected, ...images.filter((url) => !selected.includes(url))]
  function move(index: number, direction: number) {
    const next = [...selected]
    ;[next[index], next[index + direction]] = [next[index + direction], next[index]]
    onSelectionChange(next)
  }
  return (
    <Stack spacing={2}>
      <Typography variant="body2">{t('reviewInstructions', { count: selected.length })}</Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))' },
          gap: 1.5,
        }}
      >
        {ordered.map((url) => {
          const index = selected.indexOf(url)
          return (
            <Box
              key={url}
              sx={{
                minWidth: 0,
                border: '1px solid',
                borderColor: index >= 0 ? 'primary.main' : 'divider',
                borderRadius: `${radius.sm}px`,
                p: 1,
              }}
            >
              <Box
                component="img"
                src={url}
                alt={t('photo')}
                sx={{
                  width: '100%',
                  aspectRatio: '1',
                  objectFit: 'contain',
                  bgcolor: surface.paper,
                  display: 'block',
                }}
              />
              <FormControlLabel
                label={index >= 0 ? t('photoOrder', { order: index + 1 }) : t('selectPhoto')}
                control={
                  <Checkbox
                    size="small"
                    checked={index >= 0}
                    disabled={disabled || (index < 0 && selected.length >= 20)}
                    onChange={(_, checked) =>
                      onSelectionChange(
                        checked ? [...selected, url] : selected.filter((item) => item !== url),
                      )
                    }
                  />
                }
              />
              {index >= 0 && (
                <Stack direction="row">
                  <IconButton
                    size="small"
                    aria-label={t('moveEarlier')}
                    disabled={disabled || index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={t('moveLater')}
                    disabled={disabled || index === selected.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                </Stack>
              )}
            </Box>
          )
        })}
      </Box>
      <TextField
        label={t('caption')}
        multiline
        minRows={4}
        value={caption}
        disabled={disabled}
        onChange={(event) => onCaptionChange(event.target.value)}
        inputProps={{ maxLength: 2200 }}
        helperText={`${caption.length}/2200`}
      />
      <Typography variant="caption" color="text.secondary">
        {t('imagePreparation')}
      </Typography>
    </Stack>
  )
}
