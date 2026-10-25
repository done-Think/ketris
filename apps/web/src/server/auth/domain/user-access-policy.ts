import {
  AccountDeactivatedError,
  EmailNotVerifiedError,
  MembershipPendingApprovalError,
  TenantAccessBlockedError,
} from './errors'
import type { User } from './user.entity'

export function assertUserCanAuthenticate(user: User): void {
  if (!user.ativo) throw new AccountDeactivatedError()
  if (user.tenantStatus === 'SUSPENDED' || user.tenantStatus === 'CANCELED') {
    throw new TenantAccessBlockedError()
  }
  if (user.papel === 'AGENT' && user.vinculoAprovadoEm === null) {
    throw new MembershipPendingApprovalError()
  }
  if (user.emailVerifiedAt === null)
    throw new EmailNotVerifiedError({ email: user.email, tenantId: user.tenantId })
}
