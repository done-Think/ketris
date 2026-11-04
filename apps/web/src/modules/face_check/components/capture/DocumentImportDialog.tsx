'use client'

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useRef } from 'react'

import type { DocumentSide } from '../../types/session.types'

import { useDocumentImport } from '../../hooks/use-document-import'
import type {
  DocumentCropPoint,
  DocumentImportDialogProps,
} from '../../types/capture-document-import.types'
import { normalizedRegion } from '../../utils/document-import'
import { documentImportStyles as styles } from '../../styles/capture.styles'
import { PhotoErrorNotice } from './PhotoErrorNotice'

const coordinates = ['x', 'y', 'width', 'height'] as const

export function DocumentImportDialog(props: DocumentImportDialogProps) {
  const { busy, onClose } = props
  const t = useTranslations('face_check.capture.import')
  const {
    pages,
    page,
    preview,
    activeSide,
    selectSide,
    hasSuggestion,
    canConfirm,
    region,
    setRegion,
    loading,
    sending,
    error,
    detectionFailed,
    uploadError,
    disabled,
    ready,
    changePage,
    confirm,
  } = useDocumentImport(props)
  const drag = useRef<DocumentCropPoint | null>(null)

  return (
    <Dialog open fullWidth maxWidth="sm" onClose={disabled ? undefined : onClose}>
      <DialogTitle>{t(activeSide === 'front' ? 'frontTitle' : 'backTitle')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography>{t(props.singleSide ? 'singleSideHelp' : 'help')}</Typography>
          {pages > 1 ? (
            <TextField
              select
              label={t('page')}
              value={page}
              disabled={disabled}
              onChange={(event) => changePage(Number(event.target.value))}
            >
              {Array.from({ length: pages }, (_, index) => (
                <MenuItem key={index + 1} value={index + 1}>
                  {index + 1}
                </MenuItem>
              ))}
            </TextField>
          ) : null}
          {loading ? (
            <Box role="status" sx={styles.loading}>
              <CircularProgress aria-label={t('loading')} />
            </Box>
          ) : null}
          {error ? <Alert severity="error">{t(error)}</Alert> : null}
          {!loading && ready && !error ? (
            <>
              <Alert severity={hasSuggestion ? 'info' : 'warning'}>
                {t(detectionFailed ? 'detectionFailed' : hasSuggestion ? 'detected' : 'noRegions')}
              </Alert>
              <ToggleButtonGroup
                exclusive
                value={activeSide}
                disabled={disabled || props.singleSide}
                aria-label={t('sides')}
                sx={styles.sides}
                onChange={(_event, value: DocumentSide | null) => {
                  if (value) selectSide(value)
                }}
              >
                <ToggleButton value="front">{t('frontCrop')}</ToggleButton>
                <ToggleButton value="back">{t('backCrop')}</ToggleButton>
              </ToggleButtonGroup>
              {!canConfirm ? <Alert severity="info">{t('frontFirst')}</Alert> : null}
              <Box
                sx={styles.preview(disabled)}
                onPointerDown={(event) => {
                  if (disabled) return
                  const rect = event.currentTarget.getBoundingClientRect()
                  drag.current = {
                    x: (event.clientX - rect.left) / rect.width,
                    y: (event.clientY - rect.top) / rect.height,
                  }
                  event.currentTarget.setPointerCapture(event.pointerId)
                }}
                onPointerMove={(event) => {
                  if (!drag.current || disabled) return
                  const rect = event.currentTarget.getBoundingClientRect()
                  const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
                  const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))
                  setRegion(
                    normalizedRegion({
                      x: Math.min(x, drag.current.x),
                      y: Math.min(y, drag.current.y),
                      width: Math.abs(x - drag.current.x),
                      height: Math.abs(y - drag.current.y),
                    }),
                  )
                }}
                onPointerUp={() => {
                  drag.current = null
                }}
                onPointerCancel={() => {
                  drag.current = null
                }}
              >
                <Box
                  component="img"
                  src={preview}
                  alt={t('preview')}
                  draggable={false}
                  sx={styles.image}
                />
                <Box aria-hidden sx={styles.selection(region)} />
              </Box>
              <Box sx={styles.coordinates}>
                {coordinates.map((coordinate) => (
                  <TextField
                    key={coordinate}
                    type="number"
                    label={t(coordinate)}
                    value={Math.round(region[coordinate] * 100)}
                    disabled={disabled}
                    slotProps={{
                      htmlInput: {
                        min: coordinate === 'x' || coordinate === 'y' ? 0 : 1,
                        max: 100,
                        step: 1,
                      },
                    }}
                    onChange={(event) => {
                      const value = Number(event.target.value)
                      if (Number.isFinite(value))
                        setRegion(normalizedRegion({ ...region, [coordinate]: value / 100 }))
                    }}
                  />
                ))}
              </Box>
            </>
          ) : null}
          {uploadError ? <PhotoErrorNotice error={uploadError} /> : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={sending || busy} onClick={onClose}>
          {t('cancel')}
        </Button>
        <Button
          variant="contained"
          disabled={disabled || !ready || !canConfirm || Boolean(error)}
          onClick={() => void confirm()}
        >
          {sending || busy ? t('sending') : t(activeSide === 'front' ? 'sendFront' : 'sendBack')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
