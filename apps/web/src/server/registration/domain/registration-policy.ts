import type { RegistrationTenant } from '../types/account'
import { AgencyNotFoundError, TermsAcceptanceRequiredError } from './errors'

export function assertTermsAccepted(accepted: boolean): void {
  if (!accepted) throw new TermsAcceptanceRequiredError()
}

export function assertAgencyCanReceiveMembers(
  agency: RegistrationTenant | null,
): asserts agency is RegistrationTenant {
  if (!agency || agency.accountType !== 'AGENCY' || !['ACTIVE', 'TRIAL'].includes(agency.status)) {
    throw new AgencyNotFoundError()
  }
}
