import { BaseService } from '@shared/lib/api/base-service'

import type { PublicEmailChangePayload } from '../types/public-email-change'

export class EmailChangeService extends BaseService {
  confirmPublic(payload: PublicEmailChangePayload): Promise<void> {
    return this.http.post<void>('/auth/email-change/verify', payload, {
      skipUnauthorizedHandling: true,
    })
  }
}

export const emailChangeService = new EmailChangeService()
