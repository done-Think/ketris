import type { VerificationChecksInput } from '../types/face-match.types'

const blockingAlerts = ['possibleSpoof', 'nearIdenticalFaces'] as const

export function verificationChecksPassed({
  check,
  expectsCpf,
  match,
  alerts,
}: VerificationChecksInput): boolean {
  if (!check?.cardDetected || check.documentTypeMatches !== true || check.nameFound !== true)
    return false
  if (expectsCpf ? check.cpfMatches !== true : check.cpfMatches === false) return false
  if (!match.document.opened || match.document.facesFound !== 1) return false
  if (!match.selfie.opened || match.selfie.facesFound !== 1) return false

  return !blockingAlerts.some((alert) => alerts.includes(alert))
}
