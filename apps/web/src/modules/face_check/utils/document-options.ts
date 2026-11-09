import type { AcceptedDocument, DocumentType } from '../types'

const allDocumentTypes: DocumentType[] = ['RG', 'CNH', 'RNE']

export function documentOptions(accepted: AcceptedDocument): DocumentType[] {
  return accepted === 'ANY' ? allDocumentTypes : [accepted]
}
