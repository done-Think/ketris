import { useEffect, useState } from 'react'

import type { DocumentRegion } from '../types/document-import.types'
import type { DocumentSide } from '../types/session.types'

import type {
  DocumentCropSelections,
  DocumentImportOptions,
  DocumentSource,
} from '../types/capture-document-import.types'
import { cropDocument, openDocument, pageToJpeg } from '../utils/document-import'

const manualRegions: Record<DocumentSide, DocumentRegion> = {
  front: { x: 0.1, y: 0.1, width: 0.8, height: 0.35 },
  back: { x: 0.1, y: 0.55, width: 0.8, height: 0.35 },
}

export function useDocumentImport({
  file,
  token,
  side,
  busy,
  singleSide = false,
  onConfirm,
}: DocumentImportOptions) {
  const [source, setSource] = useState<DocumentSource | null>(null)
  const [activeSide, setActiveSide] = useState<DocumentSide>(side)
  const [crops, setCrops] = useState<DocumentCropSelections>({
    front: { page: 1, region: null, suggested: false },
    back: { page: 1, region: null, suggested: false },
  })
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<'fileSize' | 'pageLimit' | 'password' | 'invalid' | ''>('')
  const [detectionFailed, setDetectionFailed] = useState(false)
  const [uploadError, setUploadError] = useState<unknown>(null)
  const selection = crops[activeSide]
  const page = selection.page
  const region = selection.region ?? manualRegions[activeSide]
  const disabled = busy || loading || sending
  const canConfirm = activeSide === 'front' || side === 'back'

  useEffect(() => {
    let disposed = false
    let opened: DocumentSource | null = null
    void openDocument(file, token)
      .then((document) => {
        opened = document
        if (disposed) void document.destroy()
        else {
          setCrops((current) => ({
            ...current,
            back: { ...current.back, page: Math.min(2, document.pages) },
          }))
          setSource(document)
        }
      })
      .catch((failure: unknown) => {
        if (disposed) return
        const message = failure instanceof Error ? failure.message : ''
        const errorKey = (['fileSize', 'pageLimit', 'password'] as const).find(
          (key) => key === message,
        )
        setError(errorKey ?? 'invalid')
        setLoading(false)
      })
    return () => {
      disposed = true
      void opened?.destroy()
    }
  }, [file, token])

  useEffect(() => {
    if (!source) return
    let disposed = false
    let url = ''
    const controller = new AbortController()
    void (async () => {
      const rendered = await source.renderPage(page)
      const image = await pageToJpeg(rendered)
      if (disposed) return
      url = URL.createObjectURL(image)
      setPreview(url)
      setCanvas(rendered)
      // Document crops remain local until the person confirms the final submission.
      const suggestions: DocumentRegion[] = []
      if (disposed) return
      setCrops((current) => {
        const next = { ...current }
        if (page === current.front.page && suggestions.length >= 2 && !current.back.region) {
          next.back = { ...current.back, page }
        }
        for (const cropSide of ['front', 'back'] as const) {
          const crop = next[cropSide]
          if (crop.page !== page || crop.region) continue
          const index = cropSide === 'back' && next.front.page === page ? 1 : 0
          const suggestion = suggestions[index]
          next[cropSide] = {
            ...crop,
            region: suggestion ?? manualRegions[cropSide],
            suggested: Boolean(suggestion),
          }
        }
        return next
      })
    })()
      .catch(() => {
        if (!disposed) setError('invalid')
      })
      .finally(() => {
        if (!disposed) setLoading(false)
      })
    return () => {
      disposed = true
      controller.abort()
      if (url) URL.revokeObjectURL(url)
    }
  }, [source, page, token])

  const resetPage = () => {
    setLoading(true)
    setError('')
    setCanvas(null)
    setDetectionFailed(false)
  }

  const selectSide = (nextSide: DocumentSide) => {
    if (disabled || singleSide || nextSide === activeSide) return
    if (crops[nextSide].page !== page) resetPage()
    setUploadError(null)
    setActiveSide(nextSide)
  }

  const changePage = (nextPage: number) => {
    if (disabled || nextPage === page) return
    resetPage()
    setUploadError(null)
    setCrops((current) => ({
      ...current,
      [activeSide]: { page: nextPage, region: null, suggested: false },
    }))
  }

  const setRegion = (nextRegion: DocumentRegion) => {
    setCrops((current) => ({
      ...current,
      [activeSide]: { ...current[activeSide], region: nextRegion },
    }))
  }

  const confirm = async () => {
    if (!canvas || disabled || !canConfirm) return
    setSending(true)
    setUploadError(null)
    try {
      await onConfirm(await cropDocument(canvas, region), activeSide)
      if (activeSide === 'front' && !singleSide) {
        if (crops.back.page !== page) resetPage()
        setActiveSide('back')
      }
    } catch (failure) {
      setUploadError(failure)
    } finally {
      setSending(false)
    }
  }

  return {
    pages: source?.pages ?? 0,
    page,
    preview,
    region,
    setRegion,
    activeSide,
    selectSide,
    hasSuggestion: selection.suggested,
    canConfirm,
    loading,
    sending,
    error,
    detectionFailed,
    uploadError,
    disabled,
    ready: Boolean(canvas && selection.region),
    changePage,
    confirm,
  }
}
