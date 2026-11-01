import type { DocumentRegion } from './document-import.types'
import type { DocumentSide } from './session.types'

export interface DocumentSource {
  pages: number
  renderPage(page: number): Promise<HTMLCanvasElement>
  destroy(): void | Promise<void>
}

export interface DocumentImportDialogProps {
  file: File
  token: string
  side: DocumentSide
  busy: boolean
  onClose: () => void
  onConfirm: (image: Blob, side: DocumentSide) => Promise<void>
}

export type DocumentImportOptions = Pick<
  DocumentImportDialogProps,
  'file' | 'token' | 'side' | 'busy' | 'onConfirm'
>

export type DocumentCropPoint = Pick<DocumentRegion, 'x' | 'y'>

export interface DocumentCropSelection {
  page: number
  region: DocumentRegion | null
  suggested: boolean
}

export type DocumentCropSelections = Record<DocumentSide, DocumentCropSelection>
