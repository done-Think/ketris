import type { DocumentRegion } from '../types/document-import.types'
import { surface } from '../styles/tokens'

import type { DocumentSource } from '../types/capture-document-import.types'
import { drawToJpeg } from './image-capture'

export const maxDocumentFileBytes = 20 * 1024 * 1024
export const maxDocumentPages = 20
const maxPageSide = 2400
const cropMarginRatio = 0.02

export function isPdf(file: File) {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
}

export async function openDocument(file: File, _token: string): Promise<DocumentSource> {
  if (!file.size || file.size > maxDocumentFileBytes) throw new Error('fileSize')
  if (!isPdf(file)) {
    const bitmap = await createImageBitmap(file)
    return {
      pages: 1,
      renderPage: async () => {
        const scale = Math.min(1, maxPageSide / Math.max(bitmap.width, bitmap.height))
        const canvas = makeCanvas(bitmap.width * scale, bitmap.height * scale)
        canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
        return canvas
      },
      destroy: () => bitmap.close(),
    }
  }
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()
  const task = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    maxImageSize: 16_000_000,
    cMapUrl: new URL('/face_check/pdf/cmaps/', window.location.origin).href,
    cMapPacked: true,
    standardFontDataUrl: new URL('/face_check/pdf/standard_fonts/', window.location.origin).href,
    wasmUrl: new URL('/face_check/pdf/wasm/', window.location.origin).href,
    password: '',
  })
  try {
    const pdf = await task.promise
    if (pdf.numPages > maxDocumentPages) throw new Error('pageLimit')
    return {
      pages: pdf.numPages,
      renderPage: async (pageNumber) => {
        const page = await pdf.getPage(pageNumber)
        const original = page.getViewport({ scale: 1 })
        const scale = Math.min(3, maxPageSide / Math.max(original.width, original.height))
        const viewport = page.getViewport({ scale })
        const canvas = makeCanvas(viewport.width, viewport.height)
        try {
          await page.render({ canvas, viewport, background: surface.paper }).promise
          return canvas
        } finally {
          page.cleanup()
        }
      },
      destroy: () => task.destroy(),
    }
  } catch (error) {
    await task.destroy()
    if (error instanceof Error && error.name === 'PasswordException') throw new Error('password')
    throw error
  }
}

function makeCanvas(width: number, height: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0)
    throw new Error('invalid')
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  if (!canvas.getContext('2d')) throw new Error('invalid')
  return canvas
}

export function normalizedRegion(region: DocumentRegion): DocumentRegion {
  const x = Math.max(0, Math.min(0.99, region.x))
  const y = Math.max(0, Math.min(0.99, region.y))
  return {
    x,
    y,
    width: Math.max(0.01, Math.min(1 - x, region.width)),
    height: Math.max(0.01, Math.min(1 - y, region.height)),
  }
}

export function cropDocument(canvas: HTMLCanvasElement, region: DocumentRegion) {
  const selected = normalizedRegion(region)
  const x = Math.max(0, selected.x - selected.width * cropMarginRatio)
  const y = Math.max(0, selected.y - selected.height * cropMarginRatio)
  const box = {
    x,
    y,
    width: Math.min(1, selected.x + selected.width * (1 + cropMarginRatio)) - x,
    height: Math.min(1, selected.y + selected.height * (1 + cropMarginRatio)) - y,
  }
  const crop = makeCanvas(canvas.width * box.width, canvas.height * box.height)
  crop
    .getContext('2d')!
    .drawImage(
      canvas,
      canvas.width * box.x,
      canvas.height * box.y,
      canvas.width * box.width,
      canvas.height * box.height,
      0,
      0,
      crop.width,
      crop.height,
    )
  return drawToJpeg(crop, crop.width, crop.height)
}

export function pageToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('invalid'))),
      'image/jpeg',
      0.92,
    )
  })
}
