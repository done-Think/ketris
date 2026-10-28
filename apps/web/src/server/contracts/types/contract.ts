export type ContractStatus =
  'DRAFT' | 'IN_REVIEW' | 'AWAITING_SIGNATURE' | 'SIGNED' | 'ACTIVE' | 'CLOSED' | 'CANCELED'

export type ContractType = 'RESIDENTIAL' | 'COMMERCIAL' | 'SEASONAL'

export type AdjustmentIndex = 'IPCA' | 'IGPM' | 'INPC'

export type ContractGuaranteeType = 'GUARANTOR' | 'DEPOSIT' | 'SURETY_BOND' | 'CAPITALIZATION_BOND'

export type ContractPartyRole = 'LANDLORD' | 'RENTER' | 'GUARANTOR'

export type SignatureStatus = 'PENDING' | 'SIGNED'
