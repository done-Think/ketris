import type { ApiContractStatus } from '../types/service'

export const contractStatusMessageKeys: Record<
  ApiContractStatus,
  TranslationKey<'contracts.status'>
> = {
  DRAFT: 'draft',
  IN_REVIEW: 'review',
  AWAITING_SIGNATURE: 'awaitingSignature',
  SIGNED: 'signed',
  ACTIVE: 'active',
  CLOSED: 'closed',
  CANCELED: 'cancelled',
}

export const contractOptionMessageKeys = {
  contractTypeOptions: {
    RESIDENTIAL: 'contractTypeOptions.residential',
    COMMERCIAL: 'contractTypeOptions.commercial',
    SEASONAL: 'contractTypeOptions.shortTerm',
  },
  guaranteeTypeOptions: {
    GUARANTOR: 'guaranteeTypeOptions.guarantor',
    DEPOSIT: 'guaranteeTypeOptions.deposit',
    SURETY_BOND: 'guaranteeTypeOptions.insurance',
    CAPITALIZATION_BOND: 'guaranteeTypeOptions.capitalizationBond',
  },
  adjustmentIndexOptions: {
    IPCA: 'adjustmentIndexOptions.ipca',
    IGPM: 'adjustmentIndexOptions.igpm',
    INPC: 'adjustmentIndexOptions.inpc',
  },
} as const

export const contractPartyMessageKeys = {
  LANDLORD: 'landlord',
  RENTER: 'tenant',
  GUARANTOR: 'guarantor',
} as const
export const contractSignatureMessageKeys = { MANUAL: 'manual', PROVIDER: 'provider' } as const
import type { TranslationKey } from '@/i18n/types/messages.types'
