export const featuredPropertiesCount = 6
export const defaultSearchPurpose = 'rent'
export const apiPurposeBySearchPurpose = { rent: 'RENT', buy: 'SALE' } as const
export const defaultHomePurpose = apiPurposeBySearchPurpose[defaultSearchPurpose]
