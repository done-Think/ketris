import { useMutation } from '@tanstack/react-query'

import { marketplaceService } from '../services/marketplace-service'
import type { SubmitInquiryPayload } from '../types/public-property'

export function useSubmitPropertyInquiry(propertyId: string) {
  return useMutation({
    mutationFn: (payload: SubmitInquiryPayload) =>
      marketplaceService.submitInquiry(propertyId, payload),
  })
}
