export interface EmailVerificationIdentity {
  email: string
  tenantId: string
}

export interface PendingEmailVerificationOutput extends EmailVerificationIdentity {
  outcome: 'PENDING_EMAIL_VERIFICATION'
  emailSent: boolean
}
