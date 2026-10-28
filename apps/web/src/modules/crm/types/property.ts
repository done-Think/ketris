export type CrmPropertySummary = import('@shared/types/generated/crm/property').CrmPropertySummary
export type CrmPropertyDetail = import('@shared/types/generated/crm/property').CrmPropertyDetail
export type CrmPropertySearchFilters = Partial<
  import('@shared/types/generated/crm/property').CrmPropertyFilters
>
export type CrmPropertyPurpose = CrmPropertySummary['purpose']
export type CrmPropertyAddress = NonNullable<CrmPropertyDetail['address']>
export type CrmPropertyMedia = CrmPropertyDetail['media'][number]

export type PublicPropertyAddress = CrmPropertyAddress
