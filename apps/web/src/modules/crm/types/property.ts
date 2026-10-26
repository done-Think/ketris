export type CrmPropertySummary = import('@server/crm/types/property').CrmPropertySummary
export type CrmPropertyDetail = import('@server/crm/types/property').CrmPropertyDetail
export type CrmPropertySearchFilters = Partial<
  import('@server/crm/types/property').CrmPropertyFilters
>
export type CrmPropertyPurpose = CrmPropertySummary['purpose']
export type CrmPropertyAddress = NonNullable<CrmPropertyDetail['address']>
export type CrmPropertyMedia = CrmPropertyDetail['media'][number]

export type PublicPropertyAddress = CrmPropertyAddress
