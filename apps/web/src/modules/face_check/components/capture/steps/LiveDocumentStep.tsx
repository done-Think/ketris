'use client'

import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import type { DocumentSide } from '../../../types/session.types'

import { useCameraStream } from '../../../hooks/use-camera-stream'
import { useUploadDocumentImage } from '../../../hooks/use-capture-mutations'
import { useCaptureFlow } from '../../../stores/CaptureFlowProvider'
import type { CaptureStepProps, DocumentOrientation } from '../../../types/capture.types'
import { documentOptions } from '../../../utils/document-options'
import { CameraFallback } from '../CameraFallback'
import { CaptureLayout } from '../CaptureLayout'
import { DocumentIntro } from '../DocumentIntro'
import { DocumentImportDialog } from '../DocumentImportDialog'
import { GalleryButton } from '../GalleryButton'
import { PhotoErrorNotice } from '../PhotoErrorNotice'
import { ContinueOnPhoneButton } from '../ContinueOnPhoneButton'
import {
  documentStepStyles as styles,
  liveCaptureStyles as liveStyles,
} from '../../../styles/capture.styles'

export function LiveDocumentStep({ session }: CaptureStepProps) {
  const t = useTranslations('face_check.capture.document')
  const tLive = useTranslations('face_check.capture.live')
  const { goTo, side, documentType, chooseDocument, markCaptured } = useCaptureFlow(
    (state) => state,
  )
  const {
    status: cameraStatus,
    aspectRatio,
    attachVideo,
    grabFrame,
    restart,
  } = useCameraStream('environment')
  const upload = useUploadDocumentImage(session.token)
  const [captureFailed, setCaptureFailed] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [orientation, setOrientation] = useState<DocumentOrientation>('landscape')
  const options = documentOptions(session.acceptedDocument)
  const selected = documentType ?? options[0]
  const live = cameraStatus === 'live'
  const busy = preparing || upload.isPending

  const send = (image: Blob) => {
    setCaptureFailed(false)
    upload.mutate(
      { side, documentType: selected, image },
      {
        onSuccess: () => {
          if (!documentType) chooseDocument(selected)
          markCaptured(side, URL.createObjectURL(image))
        },
      },
    )
  }
  const prepareImage = async (getImage: () => Promise<Blob>) => {
    if (busy) return
    setPreparing(true)
    setCaptureFailed(false)
    try {
      send(await getImage())
    } catch {
      setCaptureFailed(true)
    } finally {
      setPreparing(false)
    }
  }
  const shoot = () => prepareImage(grabFrame)
  const pickFile = (file: File) => {
    if (session.allowGalleryUpload && !busy) setImportFile(file)
  }
  const sendImported = async (image: Blob, importedSide: DocumentSide) => {
    await upload.mutateAsync({ side: importedSide, documentType: selected, image })
    if (!documentType) chooseDocument(selected)
    markCaptured(importedSide, URL.createObjectURL(image))
    if (importedSide === 'back') setImportFile(null)
  }

  return (
    <CaptureLayout
      captureMode={session.captureMode}
      tone="dark"
      progressStep="document"
      onBack={busy ? undefined : () => goTo('camera')}
      footer={
        <>
          <Typography sx={styles.hint}>
            {tLive(orientation === 'portrait' ? 'documentPortraitHint' : 'documentHint')}
          </Typography>
          <Box sx={styles.shutterRow}>
            <span />
            <IconButton
              aria-label={t('shutter')}
              sx={styles.shutter}
              onClick={shoot}
              disabled={!live || busy}
            >
              {upload.isPending ? (
                <CircularProgress size={32} color="inherit" aria-label={t('uploading')} />
              ) : (
                <Box component="span" sx={styles.shutterCore} />
              )}
            </IconButton>
            <span />
          </Box>
          {session.allowGalleryUpload ? (
            <GalleryButton
              label={tLive('sendDocument')}
              onFile={pickFile}
              disabled={busy}
              accept="image/jpeg,image/png,image/heic,image/heif,application/pdf,.pdf"
            />
          ) : null}
          {live ? <ContinueOnPhoneButton token={session.token} disabled={busy} dark /> : null}
        </>
      }
    >
      <DocumentIntro options={options} selected={selected} side={side} onChoose={chooseDocument} />
      <ToggleButtonGroup
        exclusive
        value={orientation}
        aria-label={tLive('orientationLabel')}
        disabled={busy}
        onChange={(_event, value: DocumentOrientation | null) => {
          if (value) setOrientation(value)
        }}
        sx={liveStyles.orientationControl}
      >
        <ToggleButton value="landscape" sx={liveStyles.orientationOption}>
          {tLive('landscape')}
        </ToggleButton>
        <ToggleButton value="portrait" sx={liveStyles.orientationOption}>
          {tLive('portrait')}
        </ToggleButton>
      </ToggleButtonGroup>

      <Box sx={styles.stage}>
        <Box
          sx={[liveStyles.documentFrame(aspectRatio), ...(!live ? [liveStyles.inactiveFrame] : [])]}
        >
          <Box
            component="video"
            ref={attachVideo}
            autoPlay
            playsInline
            muted
            aria-label={tLive('documentPreview')}
            sx={liveStyles.video}
          />
          {live ? (
            <Box aria-hidden="true" sx={liveStyles.documentGuide(orientation, aspectRatio)} />
          ) : (
            <CameraFallback
              token={session.token}
              status={cameraStatus}
              allowGallery={session.allowGalleryUpload}
              galleryInFooter
              onFile={pickFile}
              onAlternative={() => goTo('alternative')}
              onRetry={restart}
              disabled={busy}
            />
          )}
        </Box>
        {captureFailed ? (
          <Alert severity="error" variant="outlined">
            {tLive('captureFailed')}
          </Alert>
        ) : null}
        {upload.error ? <PhotoErrorNotice error={upload.error} /> : null}
      </Box>
      {importFile && session.allowGalleryUpload ? (
        <DocumentImportDialog
          file={importFile}
          token={session.token}
          side={side}
          busy={busy}
          onClose={() => setImportFile(null)}
          onConfirm={sendImported}
        />
      ) : null}
    </CaptureLayout>
  )
}
