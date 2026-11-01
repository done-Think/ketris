export interface AuthTestEmail {
  code: string
  confirmationUrl: string | null
}

export interface FaceCheckInvitationTestEmail {
  captureUrl: string
  subject: string
  text: string
  html: string
}
