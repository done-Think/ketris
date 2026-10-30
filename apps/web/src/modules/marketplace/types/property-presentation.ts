export type PropertyText = (
  key: 'bedrooms' | 'bathrooms' | 'parking' | 'monthly' | 'priceOnRequest',
  values: { count: number } | { price: string },
) => string
