import type {
  DocumentCheck,
  DocumentType,
  SessionAlert,
} from '@server/face_check/types/session.types'

import type { DocumentReadingSummary } from '../types/face-match.types'

function combine(values: Array<boolean | null>): boolean | null {
  if (values.includes(true)) return true
  if (values.includes(false)) return false

  return null
}

export function buildDocumentCheck(
  readings: Array<DocumentReadingSummary | null | undefined>,
  chosenType: DocumentType | null,
): DocumentCheck | null {
  const present = readings.filter((reading): reading is DocumentReadingSummary => !!reading)
  if (present.length === 0) return null
  const documentTypeRead = present.find((reading) => reading.documentType)?.documentType ?? null

  return {
    cardDetected: present.some((reading) => reading.cardDetected),
    documentTypeRead,
    documentTypeMatches: documentTypeRead && chosenType ? documentTypeRead === chosenType : null,
    nameFound: combine(present.map((reading) => reading.nameFound)),
    cpfRead: present.some((reading) => reading.cpfRead),
    cpfMatches: combine(present.map((reading) => reading.cpfMatches)),
  }
}

export function documentAlertsFor(check: DocumentCheck | null): SessionAlert[] {
  if (!check) return []
  const alerts: SessionAlert[] = []
  if (!check.cardDetected) alerts.push('documentShapeNotFound')
  if (check.documentTypeMatches === false) alerts.push('documentTypeMismatch')
  if (check.nameFound === false) alerts.push('nameNotFoundOnDocument')
  if (check.cpfRead && check.cpfMatches === false) alerts.push('cpfMismatch')

  return alerts
}
