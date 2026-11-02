'use client'

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

import type { DocumentSide } from '../../../types/session.types'

import { useCameraStream } from '../../../hooks/use-camera-stream'
import { useCaptureFlow } from '../../../stores/CaptureFlowProvider'
import type { CaptureStepProps, DocumentOrientation } from '../../../types/capture.types'
import { documentOptions } from '../../../utils/document-options'
import { documentGuideCrop } from '../../../utils/document-guide'
import { CameraFallback } from '../CameraFallback'
import { CaptureLayout } from '../CaptureLayout'
import { DocumentIntro } from '../DocumentIntro'
import { DocumentImportDialog } from '../DocumentImportDialog'
import { GalleryButton } from '../GalleryButton'
import { ContinueOnPhoneButton } from '../ContinueOnPhoneButton'
import {
  documentStepStyles as styles,
  liveCaptureStyles as liveStyles,
} from '../../../styles/capture.styles'

export function LiveDocumentStep({ session }: CaptureStepProps) {
  const t = useTranslations('face_check.capture.document')
  const tLive = useTranslations('face_check.capture.live')
  const { goTo, side, documentType, chooseDocument, captureDocument, retakeTarget, cancelRetake } =
    useCaptureFlow((state) => state)
  const {
    status: cameraStatus,
    aspectRatio,
    attachVideo,
    grabPhoto,
    restart,
  } = useCameraStream('environment')
  const mounted = useRef(false)
  const capturing = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const [captureFailed, setCaptureFailed] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [orientation, setOrientation] = useState<DocumentOrientation>('landscape')
  const options = documentOptions(session.acceptedDocument)
  const selected = documentType ?? options[0]
  const live = cameraStatus === 'live'
  const busy = preparing

  const save = (image: Blob, capturedSide: DocumentSide) => {
    setCaptureFailed(false)
    if (!documentType) chooseDocument(selected)
    captureDocument(capturedSide, image)
  }
  const prepareImage = async (getImage: () => Promise<Blob>) => {
    if (capturing.current) return
    capturing.current = true
    setPreparing(true)
    setCaptureFailed(false)
    try {
      const image = await getImage()
      if (mounted.current) save(image, side)
    } catch {
      if (mounted.current) setCaptureFailed(true)
    } finally {
      capturing.current = false
      if (mounted.current) setPreparing(false)
    }
  }
  const shoot = () => prepareImage(() => grabPhoto(documentGuideCrop(orientation, aspectRatio)))
  const pickFile = (file: File) => {
    if (session.allowGalleryUpload && !busy) setImportFile(file)
  }
  const saveImported = async (image: Blob, importedSide: DocumentSide) => {
    save(image, importedSide)
    if (importedSide === 'back') setImportFile(null)
  }

  return (
    <CaptureLayout
      captureMode={session.captureMode}
      tone="dark"
      progressStep="document"
      onBack={busy ? undefined : retakeTarget ? cancelRetake : () => goTo('camera')}
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
              {preparing ? (
                <CircularProgress size={32} color="inherit" aria-label={tLive('preparingPhoto')} />
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
          {retakeTarget ? (
            <Button sx={liveStyles.galleryButton} disabled={busy} onClick={cancelRetake}>
              {tLive('keepPreviousPhoto')}
            </Button>
          ) : null}
        </>
      }
    >
      <DocumentIntro
        options={retakeTarget ? [selected] : options}
        selected={selected}
        side={side}
        onChoose={(type) => {
          if (!busy && !retakeTarget) chooseDocument(type)
        }}
      />
      <Typography sx={styles.hint}>{tLive('reviewBeforeSending')}</Typography>
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
      </Box>
      {importFile && session.allowGalleryUpload ? (
        <DocumentImportDialog
          file={importFile}
          token={session.token}
          side={side}
          busy={busy}
          singleSide={Boolean(retakeTarget)}
          onClose={() => setImportFile(null)}
          onConfirm={saveImported}
        />
      ) : null}
    </CaptureLayout>
  )
}
